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
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as RunResult;
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
