export type OutreachCategory = 
  | 'referral' 
  | 'coffee-chat' 
  | 'follow-up' 
  | 'recruiter' 
  | 'alumni' 
  | 'hiring-manager' 
  | 'thank-you' 
  | 'networking';

export type OutreachPlatform = 'linkedin' | 'email' | 'both';
export type SuccessRate = 'high' | 'medium' | 'low';

export interface OutreachTemplate {
  id: string;
  title: string;
  category: OutreachCategory;
  platform: OutreachPlatform;
  subject?: string;
  body: string;
  placeholders: string[];
  tips: string[];
  successRate: SuccessRate;
  characterCount: number;
  useCases: string[];
  tags: string[];
  isPopular: boolean;
}

export interface CategoryConfig {
  id: OutreachCategory;
  label: string;
  icon: string;
  color: string;
}

export const categoryConfigs: CategoryConfig[] = [
  { id: 'referral', label: 'Referral Request', icon: 'UserPlus', color: 'bg-blue-500' },
  { id: 'coffee-chat', label: 'Coffee Chat', icon: 'Coffee', color: 'bg-amber-500' },
  { id: 'follow-up', label: 'Follow-up', icon: 'Reply', color: 'bg-green-500' },
  { id: 'recruiter', label: 'Recruiter Outreach', icon: 'Briefcase', color: 'bg-purple-500' },
  { id: 'alumni', label: 'Alumni Connection', icon: 'GraduationCap', color: 'bg-indigo-500' },
  { id: 'hiring-manager', label: 'Hiring Manager', icon: 'UserCheck', color: 'bg-rose-500' },
  { id: 'thank-you', label: 'Thank You', icon: 'Heart', color: 'bg-pink-500' },
  { id: 'networking', label: 'Networking', icon: 'Users', color: 'bg-teal-500' },
];

export const outreachTemplates: OutreachTemplate[] = [
  // REFERRAL REQUESTS
  {
    id: 'referral-standard',
    title: 'Standard Referral Request',
    category: 'referral',
    platform: 'linkedin',
    body: `Hi {{name}},

I hope this message finds you well! I came across your profile and noticed you work at {{company}}. I'm currently exploring opportunities in {{field}} and am particularly interested in the {{role}} position.

Would you be open to a brief chat about your experience there? I'd love to learn more about the team culture and any advice you might have.

Thank you for your time!

Best,
{{your_name}}`,
    placeholders: ['name', 'company', 'field', 'role', 'your_name'],
    tips: [
      'Research the person before reaching out',
      'Mention something specific about their background',
      'Keep it concise for LinkedIn'
    ],
    successRate: 'high',
    characterCount: 456,
    useCases: ['Looking for referrals at dream company', 'Expanding professional network'],
    tags: ['Referral', 'Networking', 'Professional'],
    isPopular: true
  },
  {
    id: 'referral-mutual-connection',
    title: 'Referral via Mutual Connection',
    category: 'referral',
    platform: 'linkedin',
    body: `Hi {{name}},

{{mutual_connection}} suggested I reach out to you! I'm a {{your_role}} looking to transition into {{field}}, and they mentioned you'd be a great person to connect with given your experience at {{company}}.

I noticed the {{role}} opening and would love to hear about your journey there. Would you have 15 minutes for a quick call this week?

Thanks so much,
{{your_name}}`,
    placeholders: ['name', 'mutual_connection', 'your_role', 'field', 'company', 'role', 'your_name'],
    tips: [
      'Always get permission from mutual connection first',
      'Be specific about why they recommended this person',
      'Propose a specific time frame'
    ],
    successRate: 'high',
    characterCount: 412,
    useCases: ['Leveraging existing network', 'Warm introductions'],
    tags: ['Referral', 'Mutual Connection', 'Warm Lead'],
    isPopular: true
  },
  {
    id: 'referral-specific-role',
    title: 'Role-Specific Referral Ask',
    category: 'referral',
    platform: 'email',
    subject: 'Quick question about {{role}} at {{company}}',
    body: `Hi {{name}},

I hope this email finds you well. I'm {{your_name}}, a {{your_role}} with {{experience}} years of experience in {{field}}.

I recently applied for the {{role}} position at {{company}} and noticed you're on the {{team}} team. I'm really excited about {{specific_reason}} and believe my background in {{skill}} would be a great fit.

Would you be open to having a brief conversation about the role and potentially referring me? I'd really appreciate any insights you could share.

Thank you for considering!

Best regards,
{{your_name}}
{{your_linkedin}}`,
    placeholders: ['name', 'your_name', 'your_role', 'experience', 'field', 'role', 'company', 'team', 'specific_reason', 'skill', 'your_linkedin'],
    tips: [
      'Research the company thoroughly',
      'Be specific about what excites you',
      'Include your LinkedIn for easy reference'
    ],
    successRate: 'high',
    characterCount: 623,
    useCases: ['Applied for a specific role', 'Seeking internal referral'],
    tags: ['Referral', 'Specific Role', 'Email'],
    isPopular: false
  },

  // COFFEE CHATS
  {
    id: 'coffee-chat-informational',
    title: 'Informational Coffee Chat',
    category: 'coffee-chat',
    platform: 'linkedin',
    body: `Hi {{name}},

I've been following your work in {{field}} and I'm really impressed by {{achievement}}. As someone looking to grow in this space, I'd love to learn from your experience.

Would you be open to a 20-minute virtual coffee chat? I'm particularly curious about {{topic}}.

No pressure at all – I know you're busy!

Thanks,
{{your_name}}`,
    placeholders: ['name', 'field', 'achievement', 'topic', 'your_name'],
    tips: [
      'Mention something specific you admire',
      'Keep the time ask short (15-20 min)',
      'Give them an easy out'
    ],
    successRate: 'medium',
    characterCount: 378,
    useCases: ['Learning about a new field', 'Career exploration'],
    tags: ['Coffee Chat', 'Learning', 'Networking'],
    isPopular: true
  },
  {
    id: 'coffee-chat-career-pivot',
    title: 'Career Pivot Coffee Chat',
    category: 'coffee-chat',
    platform: 'linkedin',
    body: `Hi {{name}},

I'm {{your_name}}, currently a {{current_role}} exploring a transition into {{target_field}}. Your journey from {{their_previous_role}} to {{their_current_role}} really resonates with me.

I'd love to hear about your experience making that transition – what worked, what you'd do differently, and any advice for someone in my shoes.

Would you have 15 minutes for a quick call? I'm flexible on timing.

Thank you!
{{your_name}}`,
    placeholders: ['name', 'your_name', 'current_role', 'target_field', 'their_previous_role', 'their_current_role'],
    tips: [
      'Show you\'ve researched their career path',
      'Be specific about what you want to learn',
      'Offer flexibility on scheduling'
    ],
    successRate: 'medium',
    characterCount: 445,
    useCases: ['Career change', 'Industry transition'],
    tags: ['Coffee Chat', 'Career Pivot', 'Advice'],
    isPopular: false
  },

  // FOLLOW-UPS
  {
    id: 'follow-up-application',
    title: 'Job Application Follow-up',
    category: 'follow-up',
    platform: 'email',
    subject: 'Following up on {{role}} application',
    body: `Hi {{name}},

I hope this email finds you well. I wanted to follow up on my application for the {{role}} position that I submitted on {{date}}.

I'm very excited about the opportunity to join {{company}} and contribute to {{specific_project}}. My experience in {{relevant_skill}} aligns well with what you're looking for.

I'd welcome the chance to discuss how I can add value to your team. Please let me know if you need any additional information from me.

Thank you for your consideration.

Best regards,
{{your_name}}
{{phone}}`,
    placeholders: ['name', 'role', 'date', 'company', 'specific_project', 'relevant_skill', 'your_name', 'phone'],
    tips: [
      'Wait 1-2 weeks before following up',
      'Keep it brief and professional',
      'Add new value if possible'
    ],
    successRate: 'high',
    characterCount: 512,
    useCases: ['No response after applying', 'Checking application status'],
    tags: ['Follow-up', 'Application', 'Professional'],
    isPopular: true
  },
  {
    id: 'follow-up-interview',
    title: 'Post-Interview Follow-up',
    category: 'follow-up',
    platform: 'email',
    subject: 'Thank you for the {{role}} interview',
    body: `Hi {{name}},

Thank you so much for taking the time to speak with me today about the {{role}} position. I really enjoyed our conversation about {{topic_discussed}}.

I'm even more excited about the opportunity after learning about {{specific_detail}}. I believe my experience with {{relevant_experience}} would help me contribute meaningfully to the team.

Please don't hesitate to reach out if you need any additional information. I look forward to hearing from you.

Best regards,
{{your_name}}`,
    placeholders: ['name', 'role', 'topic_discussed', 'specific_detail', 'relevant_experience', 'your_name'],
    tips: [
      'Send within 24 hours of interview',
      'Reference something specific from the conversation',
      'Reiterate your interest and fit'
    ],
    successRate: 'high',
    characterCount: 478,
    useCases: ['After phone screen', 'After onsite interview'],
    tags: ['Follow-up', 'Interview', 'Thank You'],
    isPopular: true
  },
  {
    id: 'follow-up-no-response',
    title: 'Gentle Nudge Follow-up',
    category: 'follow-up',
    platform: 'linkedin',
    body: `Hi {{name}},

I wanted to circle back on my previous message about {{topic}}. I understand you're busy, so no worries if now isn't the right time.

If you're open to connecting, I'm still very interested in learning about {{specific_interest}}. If not, I completely understand and wish you all the best!

Thanks,
{{your_name}}`,
    placeholders: ['name', 'topic', 'specific_interest', 'your_name'],
    tips: [
      'Keep it light and no pressure',
      'Give them an easy out',
      'Wait at least a week before following up'
    ],
    successRate: 'medium',
    characterCount: 298,
    useCases: ['No response to initial outreach', 'Second follow-up'],
    tags: ['Follow-up', 'Gentle', 'Short'],
    isPopular: false
  },

  // RECRUITER OUTREACH
  {
    id: 'recruiter-proactive',
    title: 'Proactive Recruiter Message',
    category: 'recruiter',
    platform: 'linkedin',
    body: `Hi {{name}},

I noticed you recruit for {{field}} roles at {{company}}. I'm a {{your_role}} with {{experience}} years of experience specializing in {{specialty}}.

I'm actively exploring new opportunities and would love to be considered for any relevant openings. I'm particularly interested in roles involving {{interest}}.

Would you be open to a quick chat to see if there might be a fit?

Best,
{{your_name}}`,
    placeholders: ['name', 'field', 'company', 'your_role', 'experience', 'specialty', 'interest', 'your_name'],
    tips: [
      'Research the recruiter\'s focus area',
      'Be specific about what you\'re looking for',
      'Attach or link to your resume'
    ],
    successRate: 'medium',
    characterCount: 423,
    useCases: ['Job searching', 'Building recruiter network'],
    tags: ['Recruiter', 'Proactive', 'Job Search'],
    isPopular: true
  },
  {
    id: 'recruiter-response',
    title: 'Responding to Recruiter',
    category: 'recruiter',
    platform: 'linkedin',
    body: `Hi {{name}},

Thank you for reaching out about the {{role}} opportunity at {{company}}! I'm definitely interested in learning more.

A bit about me: I have {{experience}} years of experience in {{field}}, most recently at {{current_company}} where I {{achievement}}.

I'd love to schedule a call to discuss the role further. I'm available {{availability}}.

Looking forward to connecting!
{{your_name}}`,
    placeholders: ['name', 'role', 'company', 'experience', 'field', 'current_company', 'achievement', 'availability', 'your_name'],
    tips: [
      'Respond promptly (within 24-48 hours)',
      'Show genuine interest',
      'Provide specific availability'
    ],
    successRate: 'high',
    characterCount: 398,
    useCases: ['Inbound recruiter message', 'Expressing interest'],
    tags: ['Recruiter', 'Response', 'Quick'],
    isPopular: false
  },

  // ALUMNI CONNECTIONS
  {
    id: 'alumni-university',
    title: 'University Alumni Connection',
    category: 'alumni',
    platform: 'linkedin',
    body: `Hi {{name}},

Fellow {{university}} alum here! I noticed you graduated from the {{program}} program and are now working in {{field}} at {{company}}.

I'm a recent graduate (Class of {{year}}) currently exploring opportunities in {{target_field}}. I'd love to hear about your journey from {{university}} to where you are now.

Would you have 15-20 minutes for a quick chat? I'd really appreciate any insights you could share.

Go {{mascot}}!
{{your_name}}`,
    placeholders: ['name', 'university', 'program', 'field', 'company', 'year', 'target_field', 'mascot', 'your_name'],
    tips: [
      'Mention shared alma mater early',
      'Reference specific program if applicable',
      'Use school spirit (mascot, motto) to build rapport'
    ],
    successRate: 'high',
    characterCount: 456,
    useCases: ['University alumni network', 'Recent graduate networking'],
    tags: ['Alumni', 'University', 'Networking'],
    isPopular: true
  },
  {
    id: 'alumni-bootcamp',
    title: 'Bootcamp/Course Alumni',
    category: 'alumni',
    platform: 'linkedin',
    body: `Hi {{name}},

I noticed we're both {{program}} alumni! I just completed the program and saw you've transitioned into a {{role}} role at {{company}}.

I'm currently job searching and would love to hear about your experience landing your first role after the bootcamp. Any tips on what worked for you?

Happy to keep it brief – 15 minutes would be great if you're available.

Thanks!
{{your_name}}`,
    placeholders: ['name', 'program', 'role', 'company', 'your_name'],
    tips: [
      'Bootcamp alumni are often very supportive',
      'Be specific about what stage you\'re at',
      'Ask focused questions'
    ],
    successRate: 'high',
    characterCount: 389,
    useCases: ['Coding bootcamp networking', 'Online course alumni'],
    tags: ['Alumni', 'Bootcamp', 'Career Transition'],
    isPopular: false
  },

  // HIRING MANAGER
  {
    id: 'hiring-manager-direct',
    title: 'Direct to Hiring Manager',
    category: 'hiring-manager',
    platform: 'email',
    subject: 'Excited about the {{role}} opportunity',
    body: `Hi {{name}},

I recently came across the {{role}} opening on your team and wanted to reach out directly to express my strong interest.

With {{experience}} years in {{field}}, I've {{achievement}}. I'm particularly drawn to {{company}} because of {{reason}}.

I've attached my resume and would welcome the opportunity to discuss how my background aligns with what you're looking for.

Thank you for considering my application.

Best regards,
{{your_name}}
{{linkedin}}`,
    placeholders: ['name', 'role', 'experience', 'field', 'achievement', 'company', 'reason', 'your_name', 'linkedin'],
    tips: [
      'Find the hiring manager on LinkedIn first',
      'Be concise and direct',
      'Show you\'ve done your research on the company'
    ],
    successRate: 'low',
    characterCount: 534,
    useCases: ['Bypassing recruiters', 'Showing strong initiative'],
    tags: ['Hiring Manager', 'Direct', 'Bold'],
    isPopular: false
  },
  {
    id: 'hiring-manager-linkedin',
    title: 'Hiring Manager LinkedIn Message',
    category: 'hiring-manager',
    platform: 'linkedin',
    body: `Hi {{name}},

I saw you lead the {{team}} team at {{company}} and wanted to express my interest in the {{role}} position.

My background in {{skill}} and experience with {{relevant_experience}} make me confident I could contribute meaningfully to your team.

Would you be open to a brief conversation? I'd love to learn more about the role and share how I might add value.

Thanks for your time!
{{your_name}}`,
    placeholders: ['name', 'team', 'company', 'role', 'skill', 'relevant_experience', 'your_name'],
    tips: [
      'Keep it short for LinkedIn',
      'Focus on value you can add',
      'Don\'t attach resume unless asked'
    ],
    successRate: 'low',
    characterCount: 398,
    useCases: ['Direct outreach strategy', 'Standing out from applicants'],
    tags: ['Hiring Manager', 'LinkedIn', 'Short'],
    isPopular: false
  },

  // THANK YOU
  {
    id: 'thank-you-informational',
    title: 'Thank You After Informational',
    category: 'thank-you',
    platform: 'email',
    subject: 'Thank you for your time!',
    body: `Hi {{name}},

Thank you so much for taking the time to chat with me today! I really appreciated your insights on {{topic}}.

Your advice about {{specific_advice}} was particularly helpful, and I'm going to {{action_you_ll_take}}.

I'll keep you posted on my progress. Thanks again for your generosity with your time!

Best,
{{your_name}}`,
    placeholders: ['name', 'topic', 'specific_advice', 'action_you_ll_take', 'your_name'],
    tips: [
      'Send within 24 hours',
      'Reference something specific they said',
      'Mention how you\'ll apply their advice'
    ],
    successRate: 'high',
    characterCount: 345,
    useCases: ['After coffee chat', 'After informational interview'],
    tags: ['Thank You', 'Gratitude', 'Follow-up'],
    isPopular: true
  },
  {
    id: 'thank-you-referral',
    title: 'Thank You for Referral',
    category: 'thank-you',
    platform: 'email',
    subject: 'Thank you for the referral!',
    body: `Hi {{name}},

I wanted to thank you for referring me to the {{role}} position at {{company}}. I really appreciate you putting in a good word for me!

I {{status}} and will keep you updated on how things progress. Your support means a lot.

If there's ever anything I can do to return the favor, please don't hesitate to reach out.

Thanks again!
{{your_name}}`,
    placeholders: ['name', 'role', 'company', 'status', 'your_name'],
    tips: [
      'Always thank people for referrals',
      'Keep them updated on the outcome',
      'Offer to reciprocate'
    ],
    successRate: 'high',
    characterCount: 356,
    useCases: ['Received a referral', 'Showing appreciation'],
    tags: ['Thank You', 'Referral', 'Gratitude'],
    isPopular: false
  },

  // NETWORKING
  {
    id: 'networking-conference',
    title: 'Post-Conference Connection',
    category: 'networking',
    platform: 'linkedin',
    body: `Hi {{name}},

It was great meeting you at {{event}}! I really enjoyed our conversation about {{topic}}.

I'd love to stay connected and continue the discussion. Perhaps we could grab a virtual coffee sometime?

Looking forward to staying in touch!
{{your_name}}`,
    placeholders: ['name', 'event', 'topic', 'your_name'],
    tips: [
      'Connect within 48 hours of the event',
      'Reference specific conversation',
      'Suggest next steps'
    ],
    successRate: 'high',
    characterCount: 267,
    useCases: ['After conferences', 'After meetups'],
    tags: ['Networking', 'Conference', 'Follow-up'],
    isPopular: true
  },
  {
    id: 'networking-content-engagement',
    title: 'Engaging with Their Content',
    category: 'networking',
    platform: 'linkedin',
    body: `Hi {{name}},

I've been following your posts about {{topic}} and really enjoyed your recent piece on {{specific_post}}. Your point about {{insight}} really resonated with me.

I'm also passionate about {{related_topic}} and would love to connect and exchange ideas sometime.

Thanks for sharing such valuable content!
{{your_name}}`,
    placeholders: ['name', 'topic', 'specific_post', 'insight', 'related_topic', 'your_name'],
    tips: [
      'Be genuine about what you liked',
      'Reference specific content',
      'Show you\'re a thoughtful reader'
    ],
    successRate: 'medium',
    characterCount: 345,
    useCases: ['Building network through content', 'Thought leadership connections'],
    tags: ['Networking', 'Content', 'Engagement'],
    isPopular: false
  },
  {
    id: 'networking-industry-connection',
    title: 'Industry Peer Connection',
    category: 'networking',
    platform: 'linkedin',
    body: `Hi {{name}},

I came across your profile and noticed we're both working in {{industry}}. I'm currently a {{your_role}} at {{your_company}}, focusing on {{focus_area}}.

I'm always looking to connect with fellow professionals in the space. Would love to exchange ideas and stay connected!

Best,
{{your_name}}`,
    placeholders: ['name', 'industry', 'your_role', 'your_company', 'focus_area', 'your_name'],
    tips: [
      'Keep it casual and low-pressure',
      'Find common ground',
      'No immediate ask'
    ],
    successRate: 'medium',
    characterCount: 298,
    useCases: ['Building industry network', 'Peer connections'],
    tags: ['Networking', 'Industry', 'Peers'],
    isPopular: false
  },
  {
    id: 'networking-startup-founder',
    title: 'Reaching Out to Startup Founders',
    category: 'networking',
    platform: 'linkedin',
    body: `Hi {{name}},

I've been following {{company}}'s journey and I'm impressed by what you're building in the {{space}} space. {{specific_achievement}} is really exciting!

I'm a {{your_role}} passionate about {{interest}} and would love to learn more about your vision for {{company}}.

Would you have a few minutes for a quick chat? No pitch – just genuinely curious about your work!

Best,
{{your_name}}`,
    placeholders: ['name', 'company', 'space', 'specific_achievement', 'your_role', 'interest', 'your_name'],
    tips: [
      'Show genuine interest in their work',
      'Be clear you\'re not pitching anything',
      'Keep it very short'
    ],
    successRate: 'low',
    characterCount: 412,
    useCases: ['Connecting with founders', 'Startup ecosystem networking'],
    tags: ['Networking', 'Startup', 'Founder'],
    isPopular: false
  }
];

// Helper functions
export const getTemplatesByCategory = (category: OutreachCategory): OutreachTemplate[] => {
  return outreachTemplates.filter(t => t.category === category);
};

export const getTemplatesByPlatform = (platform: OutreachPlatform): OutreachTemplate[] => {
  if (platform === 'both') return outreachTemplates;
  return outreachTemplates.filter(t => t.platform === platform || t.platform === 'both');
};

export const getPopularTemplates = (): OutreachTemplate[] => {
  return outreachTemplates.filter(t => t.isPopular);
};

export const getTemplatesBySuccessRate = (rate: SuccessRate): OutreachTemplate[] => {
  return outreachTemplates.filter(t => t.successRate === rate);
};

export const searchTemplates = (query: string): OutreachTemplate[] => {
  const lowerQuery = query.toLowerCase();
  return outreachTemplates.filter(t => 
    t.title.toLowerCase().includes(lowerQuery) ||
    t.body.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    t.useCases.some(uc => uc.toLowerCase().includes(lowerQuery))
  );
};

export const getShortTemplates = (maxChars: number = 350): OutreachTemplate[] => {
  return outreachTemplates.filter(t => t.characterCount <= maxChars);
};

export const getCategoryLabel = (category: OutreachCategory): string => {
  return categoryConfigs.find(c => c.id === category)?.label || category;
};

export const getSuccessRateColor = (rate: SuccessRate): string => {
  switch (rate) {
    case 'high': return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'low': return 'bg-red-500/10 text-red-600 border-red-500/20';
  }
};

export const getPlatformLabel = (platform: OutreachPlatform): string => {
  switch (platform) {
    case 'linkedin': return 'LinkedIn';
    case 'email': return 'Email';
    case 'both': return 'Both';
  }
};
