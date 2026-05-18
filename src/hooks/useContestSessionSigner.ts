// Client-side helper for Layer 5: holds an ephemeral HMAC key, rotates every 60s,
// and produces signed headers for any contest-* edge function call.

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface KeyState {
  keyId: string;
  secret: string;
  expiresAt: number;
}

interface SignedHeaders {
  "x-contest-session": string;
  "x-contest-key-id": string;
  "x-contest-seq": string;
  "x-contest-nonce": string;
  "x-contest-ts": string;
  "x-contest-sig": string;
}

const enc = new TextEncoder();

async function hmac(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function useContestSessionSigner(sessionId: string | null | undefined) {
  const [ready, setReady] = useState(false);
  const keyRef = useRef<KeyState | null>(null);
  const seqRef = useRef<number>(0);
  const missedRotationsRef = useRef<number>(0);

  const requestKey = useCallback(
    async (mode: "issue" | "rotate") => {
      if (!sessionId) return null;
      const { data, error } = await supabase.functions.invoke("contest-session-sign", {
        body: {
          mode,
          sessionId,
          previousKeyId: mode === "rotate" ? keyRef.current?.keyId : undefined,
        },
      });
      if (error || !data?.keyId) {
        missedRotationsRef.current += 1;
        return null;
      }
      missedRotationsRef.current = 0;
      keyRef.current = {
        keyId: data.keyId,
        secret: data.secret,
        expiresAt: new Date(data.expiresAt).getTime(),
      };
      return keyRef.current;
    },
    [sessionId],
  );

  // Initial issue + 60s rotation loop.
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      const k = await requestKey("issue");
      if (!cancelled && k) setReady(true);
    })();

    const interval = window.setInterval(() => {
      requestKey("rotate");
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [sessionId, requestKey]);

  const sign = useCallback(
    async (method: string, path: string, body: string): Promise<SignedHeaders | null> => {
      if (!sessionId || !keyRef.current) return null;
      seqRef.current += 1;
      const nonce = randomNonce();
      const ts = Date.now();
      const canonical = [method.toUpperCase(), path, String(seqRef.current), nonce, String(ts), body].join("\n");
      const sig = await hmac(keyRef.current.secret, canonical);
      return {
        "x-contest-session": sessionId,
        "x-contest-key-id": keyRef.current.keyId,
        "x-contest-seq": String(seqRef.current),
        "x-contest-nonce": nonce,
        "x-contest-ts": String(ts),
        "x-contest-sig": sig,
      };
    },
    [sessionId],
  );

  const missedRotations = () => missedRotationsRef.current;

  return { ready, sign, missedRotations };
}
