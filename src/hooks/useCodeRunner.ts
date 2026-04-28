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
  raw_fermion?: FermionRawDebug;
}

export interface FermionRawDebug {
  codingTaskStatus?: string;
  runStatus?: string;
  runResult?: unknown;
  stdout?: string;
  stderr?: string;
}

export interface FunctionDiagnostics {
  error_stage?: string;
  requested_url?: string;
  judge0_status?: number;
  judge0_body?: string;
  raw_fermion_response?: unknown;
}

interface FunctionEnvelope<T> {
  ok?: boolean;
  data?: T;
  error?: string;
  diagnostics?: FunctionDiagnostics;
}

export class CodeExecutionError extends Error {
  diagnostics?: FunctionDiagnostics;
  constructor(message: string, diagnostics?: FunctionDiagnostics) {
    super(message);
    this.name = "CodeExecutionError";
    this.diagnostics = diagnostics;
  }
}

const buildFunctionError = (fallback: string, payload?: FunctionEnvelope<unknown>) => {
  const parts = [payload?.error || fallback];
  if (payload?.diagnostics?.error_stage) {
    parts.push(`stage: ${payload.diagnostics.error_stage}`);
  }
  if (payload?.diagnostics?.judge0_status) {
    parts.push(`Judge0 status: ${payload.diagnostics.judge0_status}`);
  }
  return new CodeExecutionError(parts.filter(Boolean).join(" • "), payload?.diagnostics);
};

export interface CaseResult {
  index: number;
  passed: boolean;
  runStatus: string;
  status_label: string;
  time_ms: number;
  memory_kb: number;
  input: string;
  expected: string;
  stdout: string;
  stderr: string;
  raw: FermionRawDebug;
}

export interface ExecutionLimits {
  language: string;
  cpu_ms: number;
  wall_ms: number;
  memory_kb: number;
}

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
  raw_fermion?: FermionRawDebug | null;
  case_results?: CaseResult[];
  limits?: ExecutionLimits;
}

export class RunCancelledError extends Error {
  constructor() {
    super("Run cancelled");
    this.name = "RunCancelledError";
  }
}

export const useCodeRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runController, setRunController] = useState<AbortController | null>(null);

  const cancelRun = () => {
    runController?.abort();
  };

  const run = async (params: {
    source_code: string;
    language_id: number;
    stdin?: string;
    problem_slug?: string;
    language?: string;
  }): Promise<RunResult> => {
    const controller = new AbortController();
    setRunController(controller);
    setIsRunning(true);
    try {
      const invokePromise = supabase.functions.invoke("run-code", {
        body: params,
      });
      const abortPromise = new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () => reject(new RunCancelledError()));
      });
      const { data, error } = (await Promise.race([invokePromise, abortPromise])) as Awaited<typeof invokePromise>;
      if (controller.signal.aborted) throw new RunCancelledError();
      const payload = data as FunctionEnvelope<RunResult> | undefined;
      if (error && !payload) throw error;
      if (!payload?.ok || !payload.data) {
        throw buildFunctionError(error?.message || "Run failed", payload);
      }
      return payload.data;
    } finally {
      setIsRunning(false);
      setRunController(null);
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
      const payload = data as FunctionEnvelope<SubmitResult> | undefined;
      if (error && !payload) throw error;
      if (!payload?.ok || !payload.data) {
        throw buildFunctionError(error?.message || "Submit failed", payload);
      }
      return payload.data;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { run, submit, isRunning, isSubmitting, cancelRun };
};
