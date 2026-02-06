

# Resume Analyser - Implementation Plan

## Overview

Build a fully functional AI-powered resume analyser that allows users to upload their resume (PDF/DOC/DOCX), get it analysed by AI, and receive detailed feedback with scores and actionable improvement suggestions.

## Current State

The page currently has a static UI with:
- A placeholder upload card (non-functional)
- Static mock analysis criteria with hardcoded scores
- Static quick tips

## Architecture

```text
+------------------+       +-------------------+       +------------------+
|   Frontend       |       |   Backend         |       |   AI Gateway     |
|                  |       |                   |       |                  |
| ResumeAnalyser   +------>+ analyze-resume    +------>+ Lovable AI       |
| Page             |       | Edge Function     |       | (Gemini)         |
|                  |       |                   |       |                  |
| - File Upload    |       | - Parse Document  |       | - Analyze Resume |
| - Analysis UI    |       | - Extract Text    |       | - Generate Score |
| - Results View   |       | - Call AI         |       | - Suggestions    |
+------------------+       +-------------------+       +------------------+
         |
         v
+------------------+
| Storage Bucket   |
| resume-uploads   |
+------------------+
         |
         v
+------------------+
| Database Table   |
| resume_analyses  |
+------------------+
```

## Implementation Steps

### Phase 1: Backend Infrastructure

#### 1.1 Create Storage Bucket
Create a new storage bucket `resume-uploads` for storing uploaded resume files with RLS policies to ensure users can only access their own uploads.

#### 1.2 Create Database Table
Create a `resume_analyses` table to store analysis results:
- `id` (uuid, primary key)
- `user_id` (text, references auth user)
- `file_name` (text)
- `file_url` (text)
- `overall_score` (integer, 0-100)
- `ats_score` (integer, 0-100)
- `keyword_score` (integer, 0-100)
- `format_score` (integer, 0-100)
- `content_score` (integer, 0-100)
- `suggestions` (jsonb, array of improvement suggestions)
- `strengths` (jsonb, array of identified strengths)
- `keywords_found` (jsonb, array of detected keywords)
- `created_at` (timestamp)

#### 1.3 Create Edge Function
Create `analyze-resume` edge function that:
- Accepts the uploaded resume file path
- Extracts text content from the resume
- Sends the text to Lovable AI (using `google/gemini-2.5-flash`) with a specialized prompt
- Parses the AI response into structured scores and suggestions
- Returns the analysis results

### Phase 2: Frontend Components

#### 2.1 Create Custom Hook
Create `useResumeAnalysis` hook:
- Handle file upload to storage
- Call the edge function
- Manage loading/error states
- Fetch analysis history

#### 2.2 File Upload Component
Create `ResumeUploadZone` component:
- Drag and drop support
- Click to browse files
- File type validation (PDF, DOC, DOCX)
- File size validation (max 5MB)
- Upload progress indicator
- Preview of selected file

#### 2.3 Analysis Results Components
Create several sub-components:
- `AnalysisScoreCard` - Circular progress showing overall score
- `AnalysisCriteriaCard` - Individual score breakdowns with progress bars
- `AnalysisSuggestions` - Actionable improvement recommendations
- `AnalysisStrengths` - Identified resume strengths
- `AnalysisKeywords` - Detected industry keywords

#### 2.4 Analysis History
Create `ResumeAnalysisHistory` component:
- List of previous analyses
- Ability to view past results
- Delete old analyses

### Phase 3: Main Page Integration

Update the `ResumeAnalyser.tsx` page to:
- Integrate the file upload component
- Show loading state during analysis
- Display results when analysis completes
- Show analysis history for returning users
- Add job description input (optional) for targeted analysis

## Technical Details

### Edge Function Prompt Structure
```
Analyze this resume and provide:
1. ATS Compatibility Score (0-100) - How well formatted for ATS systems
2. Keyword Optimization Score (0-100) - Presence of industry keywords
3. Format & Structure Score (0-100) - Layout, sections, readability
4. Content Quality Score (0-100) - Impact statements, quantifiable achievements

Also provide:
- 5 specific improvement suggestions with priority
- 3-5 identified strengths
- List of detected industry keywords
- Overall assessment summary

Format response as JSON.
```

### File Handling
- Files uploaded to `resume-uploads/{user_id}/{timestamp}-{filename}`
- Use Supabase storage signed URLs for secure access
- Clean up old uploads after 30 days (optional background job)

### Error Handling
- Invalid file type errors
- File too large errors
- AI rate limiting
- Network failures with retry logic

## New Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/analyze-resume/index.ts` | Edge function for AI analysis |
| `src/hooks/useResumeAnalysis.ts` | Custom hook for analysis logic |
| `src/components/resume/ResumeUploadZone.tsx` | File upload with drag/drop |
| `src/components/resume/AnalysisScoreCard.tsx` | Overall score display |
| `src/components/resume/AnalysisCriteriaCard.tsx` | Individual criteria scores |
| `src/components/resume/AnalysisSuggestions.tsx` | Improvement suggestions |
| `src/components/resume/AnalysisStrengths.tsx` | Resume strengths |
| `src/components/resume/AnalysisKeywords.tsx` | Detected keywords |
| `src/components/resume/ResumeAnalysisHistory.tsx` | History of analyses |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/research/ResumeAnalyser.tsx` | Complete rewrite with functional components |

## Database Migration

```sql
-- Create resume_analyses table
CREATE TABLE public.resume_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  ats_score INTEGER CHECK (ats_score >= 0 AND ats_score <= 100),
  keyword_score INTEGER CHECK (keyword_score >= 0 AND ats_score <= 100),
  format_score INTEGER CHECK (format_score >= 0 AND format_score <= 100),
  content_score INTEGER CHECK (content_score >= 0 AND content_score <= 100),
  suggestions JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  keywords_found JSONB DEFAULT '[]'::jsonb,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own analyses" ON public.resume_analyses
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own analyses" ON public.resume_analyses
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own analyses" ON public.resume_analyses
  FOR DELETE USING (user_id = auth.uid()::text);
```

## User Experience Flow

1. User navigates to Resume Analyser page
2. User drags/drops or clicks to upload resume
3. File is validated and uploaded to storage
4. Loading animation shows while AI analyzes
5. Results appear with overall score prominently displayed
6. Detailed breakdown shows each criteria with scores
7. Actionable suggestions are listed with priority indicators
8. User can view analysis history and re-analyze

## Dependencies

- Uses existing Lovable AI integration (no new API keys needed)
- Leverages existing Supabase storage patterns from Settings page
- Follows existing UI patterns from quiz and other analysis features

