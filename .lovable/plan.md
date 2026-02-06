

# Cold DMs / Emails Page - Implementation Plan

## Overview
Build a comprehensive Cold Outreach page that helps job seekers craft effective cold DMs and emails for networking, referrals, and job applications. The page will feature curated templates, AI-powered personalization, copy functionality, favoriting/saving, and usage tracking.

## Current State
The existing `ColdOutreach.tsx` is a basic skeleton with:
- Static template cards with minimal data (title, platform, success rate, saves)
- Basic search input (non-functional)
- Platform tabs (LinkedIn/Email) with no filtering logic
- Copy and Star buttons that don't work

## Proposed Features

### 1. Rich Template Data Structure
Create a new data file `src/data/coldOutreachData.ts` with comprehensive templates including:
- **Template Categories**: Referral Requests, Coffee Chats, Job Follow-ups, Recruiter Outreach, Alumni Connections, Hiring Manager Direct, Thank You Notes, Networking
- **Template Fields**: 
  - id, title, category, platform (LinkedIn/Email/Both)
  - subject line (for emails)
  - body content with placeholders (e.g., `{{company}}`, `{{role}}`, `{{your_name}}`)
  - success rate indicator (High/Medium/Low)
  - tips for customization
  - example use cases
  - character count for LinkedIn (500 char limit awareness)

### 2. Template Cards with Preview & Copy
Enhanced template cards showing:
- Title and category badge
- Platform icon (LinkedIn/Mail)
- Success rate badge (color-coded)
- Preview snippet (first 100 chars)
- Quick copy button with toast notification
- Expand to view full template in a dialog/sheet
- Favorite/save button for logged-in users

### 3. Template Detail Modal
When clicking a template, open a Sheet/Dialog showing:
- Full template content with highlighted placeholders
- Placeholder input fields for personalization
- Live preview of personalized message
- Copy personalized version button
- Character count (especially for LinkedIn)
- Tips section for best practices
- Related templates suggestions

### 4. AI-Powered Personalization (using existing Astra AI)
Add an "AI Personalize" button that:
- Takes user inputs (company name, role, recruiter name, etc.)
- Uses the existing astra-chat edge function to generate a personalized version
- Shows streaming AI response
- Allows copying the AI-generated version

### 5. Search & Filtering
Implement working filters:
- Search across title, content, and tags
- Platform filter tabs (All/LinkedIn/Email)
- Category filter dropdown
- Success rate filter
- Quick filter chips: "Most Popular", "ATS-Friendly", "Short & Sweet"

### 6. User Features (Logged-in users)
- **Favorites/Saved Templates**: Save templates to a collection
- **Copy History**: Track recently copied templates
- **Custom Templates**: Create and save personal templates
- **Usage Stats**: Show how many times user has used each template

### 7. Stats Dashboard
Hero section with statistics:
- Total templates available
- Average success rate
- Most popular category
- Community usage stats

## Technical Implementation

### New Files to Create

1. **`src/data/coldOutreachData.ts`**
   - Template interface definition
   - 20+ curated templates across categories
   - Category and platform configurations
   - Helper functions for filtering

2. **`src/components/outreach/OutreachHeroSection.tsx`**
   - Stats dashboard header
   - Visual design matching ResumeHeroSection pattern

3. **`src/components/outreach/OutreachTemplateCard.tsx`**
   - Card component with preview, badges, actions
   - Favorite toggle integration
   - Copy with toast notification

4. **`src/components/outreach/OutreachTemplateDetail.tsx`**
   - Sheet/Dialog for full template view
   - Placeholder personalization form
   - Live preview area
   - AI personalization integration

5. **`src/components/outreach/OutreachFilterBar.tsx`**
   - Search input
   - Platform tabs
   - Category dropdown
   - Success rate filter
   - Quick filter chips

6. **`src/components/outreach/OutreachAIPersonalizer.tsx`**
   - AI personalization interface
   - Streaming response display
   - Uses existing astra-chat edge function

7. **`src/hooks/useOutreachFavorites.ts`**
   - Hook for managing saved templates
   - Uses localStorage for guests, Supabase for logged-in users

8. **`src/hooks/useOutreachCopy.ts`**
   - Hook for copy functionality with history tracking

### Database Changes
Create a new table for user outreach preferences:

```sql
CREATE TABLE outreach_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  template_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, template_id)
);

-- RLS policies
ALTER TABLE outreach_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON outreach_favorites 
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert own favorites" ON outreach_favorites 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can delete own favorites" ON outreach_favorites 
  FOR DELETE USING (auth.uid() = user_id);
```

Optionally, track copy/usage history:
```sql
CREATE TABLE outreach_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  template_id TEXT NOT NULL,
  copied_at TIMESTAMPTZ DEFAULT now()
);
```

### Updated Files

1. **`src/pages/research/ColdOutreach.tsx`**
   - Complete rewrite to integrate all new components
   - State management for filters, selected template, AI mode
   - Responsive layout matching other pages

## Template Content Examples

```typescript
export interface OutreachTemplate {
  id: string;
  title: string;
  category: 'referral' | 'coffee-chat' | 'follow-up' | 'recruiter' | 'alumni' | 'hiring-manager' | 'thank-you' | 'networking';
  platform: 'linkedin' | 'email' | 'both';
  subject?: string; // For email templates
  body: string;
  placeholders: string[]; // e.g., ['company', 'role', 'mutual_connection']
  tips: string[];
  successRate: 'high' | 'medium' | 'low';
  characterCount: number;
  useCases: string[];
  tags: string[];
  isPopular: boolean;
}

// Example template:
{
  id: 'referral-standard',
  title: 'Standard Referral Request',
  category: 'referral',
  platform: 'linkedin',
  body: `Hi {{name}},

I hope this message finds you well! I came across your profile and noticed you work at {{company}}. I'm currently exploring opportunities in {{field}} and am particularly interested in the {{role}} position at {{company}}.

Would you be open to a brief chat about your experience there? I'd love to learn more about the team culture and any advice you might have.

Thank you for your time!

Best,
{{your_name}}`,
  placeholders: ['name', 'company', 'field', 'role', 'your_name'],
  tips: [
    'Research the person before reaching out',
    'Mention something specific about their background',
    'Keep it under 300 characters for LinkedIn'
  ],
  successRate: 'high',
  characterCount: 456,
  useCases: ['Looking for referrals at dream company', 'Expanding professional network'],
  tags: ['Referral', 'Networking', 'Professional'],
  isPopular: true
}
```

## UI/UX Design

### Layout Structure
```text
+------------------------------------------+
|  Hero: Stats Dashboard                    |
|  [Templates] [Success Rate] [Copies]      |
+------------------------------------------+
|  Filter Bar                               |
|  [Search...] [Platform v] [Category v]    |
|  [High Success] [Short] [Popular]         |
+------------------------------------------+
|  Template Grid (3 columns on desktop)     |
|  +--------+ +--------+ +--------+         |
|  |Template| |Template| |Template|         |
|  |  Card  | |  Card  | |  Card  |         |
|  +--------+ +--------+ +--------+         |
+------------------------------------------+
```

### Mobile Responsiveness
- Single column grid on mobile
- Collapsible filter section
- Full-screen template detail sheet
- Floating action button for AI personalization

## Implementation Order

1. Create data file with templates
2. Build filter bar component
3. Build template card component
4. Build template detail sheet/dialog
5. Update main page to integrate components
6. Add copy functionality with toast
7. Implement search and filtering logic
8. Add favorites functionality (local storage first)
9. Create database migration for favorites
10. Implement AI personalization feature
11. Add usage tracking
12. Polish animations and transitions

## Success Metrics
- Templates are easily searchable and filterable
- Copy functionality works with clear feedback
- AI personalization generates relevant content
- Page is fully responsive
- Matches the visual design language of other pages (Resume Templates, Interview Questions)

