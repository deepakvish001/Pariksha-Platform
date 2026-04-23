import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RunResult {
  status: { id: number; description: string };
  stdout: string;
  stderr: string;
  compile_output: string;
  message: string;
  time: number | null;
  memory: number | null;
}

interface FunctionDiagnostics {
  error_stage?: string;
  requested_url?: string;
  judge0_status?: number;
  judge0_body?: string;
}

interface FunctionEnvelope<T> {
  ok?: boolean;
  data?: T;
  error?: string;
  diagnostics?: FunctionDiagnostics;
}

const buildFunctionError = (fallback: string, payload?: FunctionEnvelope<unknown>) => {
  const parts = [payload?.error || fallback];
  if (payload?.diagnostics?.error_stage) {
    parts.push(`stage: ${payload.diagnostics.error_stage}`);
  }
  if (payload?.diagnostics?.judge0_status) {
    parts.push(`Judge0 status: ${payload.diagnostics.judge0_status}`);
  }
  return new Error(parts.filter(Boolean).join(" • "));
};

export interface SubmitResult {
  verdict: string;
  passed: number;
  total: number;
  runtime_ms: number;
  memory_kb: number;
  failing_case: {
    index: number;
    input: string;
    expected: string;
    output: string;
    error?: string;
  } | null;
  stderr: string | null;
  submission_id: string | null;
}

export const useCodeRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const run = async (params: {
    source_code: string;
    language_id: number;
    stdin?: string;
  }): Promise<RunResult> => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("run-code", {
        body: params,
      });
      const payload = data as FunctionEnvelope<RunResult> | undefined;
      if (error && !payload) throw error;
      if (!payload?.ok || !payload.data) {
        throw buildFunctionError(error?.message || "Run failed", payload);
      }
      return payload.data;
    } finally {
      setIsRunning(false);
    }
  };

  const submit = async (params: {
    source_code: string;
    language: string;
    language_id: number;
    problem_slug: string;
    tests: { input: string; expected: string }[];
    cpu_time_limit?: number;
    memory_limit?: number;
  }): Promise<SubmitResult> => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-code", {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as SubmitResult;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { run, submit, isRunning, isSubmitting };
};
