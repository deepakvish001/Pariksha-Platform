import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useCallback } from "react";
import type { Battle, BattleEvent, PlayerRating, BattleDifficulty } from "./types";
import { useBattleStore } from "./store";

export function useMyRating(userId: string | null | undefined) {
  const [rating, setRating] = useState<PlayerRating | null>(null);
  const [loading, setLoading] = useState(true);
  const refetch = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from("player_ratings" as never).select("*").eq("user_id", userId).maybeSingle();
    setRating(data as PlayerRating | null);
    setLoading(false);
  }, [userId]);
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    refetch();
  }, [userId, refetch]);
  return { rating, loading, refetch };
}

export async function ensureRating(userId: string) {
  const { data } = await supabase.from("player_ratings" as never).select("user_id").eq("user_id", userId).maybeSingle();
  if (!data) {
    await supabase.from("player_ratings" as never).insert({ user_id: userId } as never);
  }
}

export async function joinQueue(topic: string | null, difficulty: BattleDifficulty): Promise<string | null> {
  const { data, error } = await supabase.rpc("battle_matchmake" as never, { _topic: topic, _difficulty: difficulty } as never);
  if (error) throw error;
  return (data as string | null) ?? null;
}

export async function leaveQueue(userId: string) {
  await supabase.from("battle_queue" as never).delete().eq("user_id", userId);
}

export async function finishBattle(battleId: string, winner: string | null, reason: string) {
  const { error } = await supabase.rpc("battle_finish" as never, { _battle_id: battleId, _winner: winner, _reason: reason } as never);
  if (error) throw error;
}

export async function emitEvent(battleId: string, userId: string, kind: string, payload: Record<string, unknown> = {}) {
  await supabase.from("battle_events" as never).insert({ battle_id: battleId, user_id: userId, kind, payload } as never);
}

export async function recordSubmission(battleId: string, userId: string, language: string, source: string, passed: number, total: number, verdict: string, runtimeMs: number | null) {
  await supabase.from("battle_submissions" as never).insert({
    battle_id: battleId, user_id: userId, language, source_code: source, passed, total, verdict, runtime_ms: runtimeMs,
  } as never);
  await emitEvent(battleId, userId, "submit", { passed, total, verdict });
}

export function useBattle(battleId: string | undefined) {
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);
  const setStore = useBattleStore((s) => s.setBattle);

  useEffect(() => {
    if (!battleId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("battles" as never).select("*").eq("id", battleId).maybeSingle();
      if (cancelled) return;
      setBattle(data as Battle | null);
      setStore(data as Battle | null);
      setLoading(false);
    })();
    const ch = supabase
      .channel(`battle-${battleId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "battles", filter: `id=eq.${battleId}` }, (p) => {
        setBattle(p.new as Battle);
        setStore(p.new as Battle);
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [battleId, setStore]);
  return { battle, loading };
}

export function useBattleEvents(battleId: string | undefined) {
  const pushEvent = useBattleStore((s) => s.pushEvent);
  useEffect(() => {
    if (!battleId) return;
    const ch = supabase
      .channel(`battle-events-${battleId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "battle_events", filter: `battle_id=eq.${battleId}` }, (p) => {
        pushEvent(p.new as BattleEvent);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [battleId, pushEvent]);
}
