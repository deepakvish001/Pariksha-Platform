import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type Kind = "webcam" | "screen" | "sideeye";

const BUCKET = "assessment-proctor";

function pickMime(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  for (const m of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) return m;
  }
  return "video/webm";
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// IndexedDB-backed retry queue. Keyed by an internal id; rows hold the blob
// and the metadata needed to insert into the session_chunks table.
type QueueRow = {
  id: string;
  attemptId: string;
  kind: Kind;
  sessionId: string;
  seq: number;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  mime: string;
  path: string;
  blob: Blob;
};

const DB_NAME = "pariksha-session-recorder";
const STORE = "pending";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function enqueue(row: QueueRow) {
  try {
    const db = await openDb();
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(row);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  } catch {
    /* persistence best-effort */
  }
}

async function drain(): Promise<void> {
  let db: IDBDatabase | null = null;
  try {
    db = await openDb();
    const rows: QueueRow[] = await new Promise((res, rej) => {
      const tx = db!.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => res(req.result as QueueRow[]);
      req.onerror = () => rej(req.error);
    });
    for (const row of rows) {
      const ok = await uploadAndInsert(row);
      if (ok) {
        await new Promise<void>((res) => {
          const tx = db!.transaction(STORE, "readwrite");
          tx.objectStore(STORE).delete(row.id);
          tx.oncomplete = () => res();
          tx.onerror = () => res();
        });
      }
    }
  } catch {
    /* ignore */
  } finally {
    db?.close();
  }
}

async function uploadAndInsert(row: QueueRow): Promise<boolean> {
  try {
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(row.path, row.blob, { contentType: row.mime, upsert: false });
    // If the object already exists (race / retry after partial), treat as success.
    if (upErr && !/already exists|Duplicate/i.test(upErr.message)) return false;
    const user = (await supabase.auth.getUser()).data.user;
    const { error: insErr } = await supabase.from("assessment_proctor_session_chunks").insert({
      attempt_id: row.attemptId,
      session_id: row.sessionId,
      kind: row.kind,
      seq: row.seq,
      started_at: row.startedAt,
      ended_at: row.endedAt,
      duration_ms: row.durationMs,
      size_bytes: row.blob.size,
      mime: row.mime,
      storage_path: row.path,
      uploaded_by: user?.id ?? null,
    });
    if (insErr && !/duplicate key/i.test(insErr.message)) return false;
    return true;
  } catch {
    return false;
  }
}

interface Options {
  stream: MediaStream | null;
  attemptId: string | null | undefined;
  kind: Kind;
  enabled: boolean;
  chunkMs?: number;
  bitsPerSecond?: number;
}

/**
 * Continuously records `stream` in independently playable WebM segments and
 * uploads each to storage + writes a row in `assessment_proctor_session_chunks`.
 *
 * Resilient: each chunk is a self-contained file. Failed uploads fall back to
 * an IndexedDB queue that drains on reconnect and on page show.
 */
export function useChunkedRecorder({
  stream,
  attemptId,
  kind,
  enabled,
  chunkMs = 165_000,
  bitsPerSecond = 800_000,
}: Options) {
  const recRef = useRef<MediaRecorder | null>(null);
  const sessionIdRef = useRef<string>(uuid());
  const seqRef = useRef(0);
  const startTsRef = useRef(0);
  const cycleTimerRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    const onOnline = () => { void drain(); };
    const onShow = () => { void drain(); };
    window.addEventListener("online", onOnline);
    window.addEventListener("pageshow", onShow);
    void drain();
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("pageshow", onShow);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !stream || !attemptId) return;
    // Reset per-stream session.
    sessionIdRef.current = uuid();
    seqRef.current = 0;
    stoppedRef.current = false;

    const mime = pickMime();

    const startCycle = () => {
      if (stoppedRef.current) return;
      let rec: MediaRecorder;
      try {
        rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitsPerSecond });
      } catch {
        return;
      }
      const chunks: BlobPart[] = [];
      const seq = seqRef.current++;
      const startedAt = new Date();
      startTsRef.current = startedAt.getTime();

      rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(chunks, { type: mime });
        const endedAt = new Date();
        const seqStr = String(seq).padStart(5, "0");
        const ext = mime.includes("mp4") ? "mp4" : "webm";
        const path = `${attemptId}/sessions/${kind}/${sessionIdRef.current}/${seqStr}.${ext}`;
        const row: QueueRow = {
          id: `${attemptId}-${kind}-${sessionIdRef.current}-${seqStr}`,
          attemptId,
          kind,
          sessionId: sessionIdRef.current,
          seq,
          startedAt: startedAt.toISOString(),
          endedAt: endedAt.toISOString(),
          durationMs: endedAt.getTime() - startedAt.getTime(),
          mime,
          path,
          blob,
        };
        const ok = await uploadAndInsert(row);
        if (!ok) await enqueue(row);
        if (!stoppedRef.current) startCycle();
      };

      recRef.current = rec;
      try { rec.start(); } catch { return; }
      cycleTimerRef.current = window.setTimeout(() => {
        try { rec.state === "recording" && rec.stop(); } catch { /* noop */ }
      }, chunkMs);
    };

    startCycle();

    const onBeforeUnload = () => {
      stoppedRef.current = true;
      try { recRef.current?.state === "recording" && recRef.current.stop(); } catch { /* noop */ }
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      stoppedRef.current = true;
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (cycleTimerRef.current) window.clearTimeout(cycleTimerRef.current);
      cycleTimerRef.current = null;
      try { recRef.current?.state === "recording" && recRef.current.stop(); } catch { /* noop */ }
    };
  }, [enabled, stream, attemptId, kind, chunkMs, bitsPerSecond]);
}

export default useChunkedRecorder;
