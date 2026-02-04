import { z } from "zod";

// URL validation helpers
const urlSchema = z
  .string()
  .url({ message: "Please enter a valid URL" })
  .or(z.literal(""));

const optionalUrlSchema = z
  .string()
  .refine(
    (val) => {
      if (!val || val.trim() === "") return true;
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Please enter a valid URL" }
  )
  .optional()
  .nullable();

// Specific platform URL validators
export const validateTwitterUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url || url.trim() === "") return { valid: true };
  
  const twitterPattern = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[\w]+\/?$/i;
  if (!twitterPattern.test(url)) {
    return { 
      valid: false, 
      error: "Please enter a valid Twitter/X URL (e.g., https://twitter.com/username)" 
    };
  }
  return { valid: true };
};

export const validateLinkedInUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url || url.trim() === "") return { valid: true };
  
  const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/i;
  if (!linkedinPattern.test(url)) {
    return { 
      valid: false, 
      error: "Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)" 
    };
  }
  return { valid: true };
};

export const validateGitHubUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url || url.trim() === "") return { valid: true };
  
  const githubPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/?$/i;
  if (!githubPattern.test(url)) {
    return { 
      valid: false, 
      error: "Please enter a valid GitHub URL (e.g., https://github.com/username)" 
    };
  }
  return { valid: true };
};

export const validateInstagramUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url || url.trim() === "") return { valid: true };
  
  const instagramPattern = /^https?:\/\/(www\.)?instagram\.com\/[\w.]+\/?$/i;
  if (!instagramPattern.test(url)) {
    return { 
      valid: false, 
      error: "Please enter a valid Instagram URL (e.g., https://instagram.com/username)" 
    };
  }
  return { valid: true };
};

export const validateLeetCodeUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url || url.trim() === "") return { valid: true };
  
  const leetcodePattern = /^https?:\/\/(www\.)?leetcode\.com\/(u\/)?[\w-]+\/?$/i;
  if (!leetcodePattern.test(url)) {
    return { 
      valid: false, 
      error: "Please enter a valid LeetCode URL (e.g., https://leetcode.com/username)" 
    };
  }
  return { valid: true };
};

export const validateHackerRankUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url || url.trim() === "") return { valid: true };
  
  const hackerrankPattern = /^https?:\/\/(www\.)?hackerrank\.com\/(profile\/)?[\w-]+\/?$/i;
  if (!hackerrankPattern.test(url)) {
    return { 
      valid: false, 
      error: "Please enter a valid HackerRank URL (e.g., https://hackerrank.com/profile/username)" 
    };
  }
  return { valid: true };
};

export const validateCodeForcesUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url || url.trim() === "") return { valid: true };
  
  const codeforcesPattern = /^https?:\/\/(www\.)?codeforces\.com\/profile\/[\w-]+\/?$/i;
  if (!codeforcesPattern.test(url)) {
    return { 
      valid: false, 
      error: "Please enter a valid CodeForces URL (e.g., https://codeforces.com/profile/username)" 
    };
  }
  return { valid: true };
};

export const validateCodeChefUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url || url.trim() === "") return { valid: true };
  
  const codechefPattern = /^https?:\/\/(www\.)?codechef\.com\/users\/[\w-]+\/?$/i;
  if (!codechefPattern.test(url)) {
    return { 
      valid: false, 
      error: "Please enter a valid CodeChef URL (e.g., https://codechef.com/users/username)" 
    };
  }
  return { valid: true };
};

export const validateGeeksForGeeksUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url || url.trim() === "") return { valid: true };
  
  const gfgPattern = /^https?:\/\/(www\.)?(geeksforgeeks\.org|auth\.geeksforgeeks\.org)\/user\/[\w-]+\/?$/i;
  if (!gfgPattern.test(url)) {
    return { 
      valid: false, 
      error: "Please enter a valid GeeksForGeeks URL (e.g., https://geeksforgeeks.org/user/username)" 
    };
  }
  return { valid: true };
};

export const validateGenericUrl = (url: string): { valid: boolean; error?: string } => {
  if (!url || url.trim() === "") return { valid: true };
  
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: "Please enter a valid URL" };
  }
};

export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  if (!username || username.trim() === "") return { valid: true };
  
  if (username.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" };
  }
  
  if (username.length > 30) {
    return { valid: false, error: "Username must be less than 30 characters" };
  }
  
  const usernamePattern = /^[a-zA-Z0-9_-]+$/;
  if (!usernamePattern.test(username)) {
    return { 
      valid: false, 
      error: "Username can only contain letters, numbers, underscores, and hyphens" 
    };
  }
  
  return { valid: true };
};

// Profile validation schema
export const profileValidationSchema = z.object({
  username: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  location: z.string().max(100, "Location must be less than 100 characters").optional(),
  occupation: z.string().max(100, "Occupation must be less than 100 characters").optional(),
  website: optionalUrlSchema,
  mobile_number: z.string().optional(),
  twitter_url: optionalUrlSchema,
  linkedin_url: optionalUrlSchema,
  github_url: optionalUrlSchema,
  instagram_url: optionalUrlSchema,
  resume_url: optionalUrlSchema,
  leetcode_url: optionalUrlSchema,
  hackerrank_url: optionalUrlSchema,
  codeforces_url: optionalUrlSchema,
  codechef_url: optionalUrlSchema,
  geeksforgeeks_url: optionalUrlSchema,
});

export type ProfileValidation = z.infer<typeof profileValidationSchema>;
