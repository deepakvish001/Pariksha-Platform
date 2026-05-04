
ALTER TABLE public.contest_code_provenance ALTER COLUMN problem_id TYPE TEXT USING problem_id::text;
ALTER TABLE public.contest_solve_time_analysis ALTER COLUMN problem_id TYPE TEXT USING problem_id::text;
