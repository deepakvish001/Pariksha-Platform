
# Plan: Redesign Company Wise Resources Page

## Overview
Transform the current card-based Company Resources page into a modern, clean tabular list design inspired by the reference screenshot. The new design features a numbered company list with descriptions, category badges, tab filtering, search functionality, and pagination.

---

## Design Analysis from Reference

The reference image shows:
- Clean list-based layout with numbered entries
- Company name as bold title with detailed description below
- Category badge on the right side (e.g., "FinTech", "AI/Technology", "E-commerce/Technology")
- Tab navigation for filtering (All Companies, Product Based, Service Based, Startup, Hiring, Favorites)
- Search bar at top
- Pagination at bottom

---

## Implementation Steps

### 1. Create Company Data Structure

**New File: `src/data/companyResourcesData.ts`**

Create a comprehensive data file with company information:

```typescript
export interface Company {
  id: string;
  name: string;
  description: string;
  category: string;       // "FinTech", "AI/Technology", etc.
  type: CompanyType[];    // "product", "service", "startup"
  isHiring: boolean;
}

export type CompanyType = "product" | "service" | "startup";

export const companies: Company[] = [
  {
    id: "acko-insurance",
    name: "Acko Insurance",
    description: "An independent, digital-first general insurance company offering simplified insurance products for cars, bikes, and health. Acko utilizes technology to eliminate intermediaries and paperwork, providing a seamless customer experience with instant policy issuance and fast claim settlements.",
    category: "FinTech",
    type: ["product", "startup"],
    isHiring: true,
  },
  // ... 50+ companies
];
```

Include companies from the reference:
- Acko Insurance (FinTech)
- Ai.tech (AI/Technology)
- Amagi (Media Tech)
- Amazon (E-commerce/Technology)
- ApClub (Health & Wellness)
- Apna.co (Recruitment)
- Apple (Technology)
- Ather Energy (EV/Mobility)
- Autodraft (Media/AI)
- Beyond Appliances (Consumer Electronics)
- Google, Microsoft, Meta, Netflix (FAANG)
- And many more...

---

### 2. Redesign CompanyResources Page

**File: `src/pages/library/CompanyResources.tsx`**

Complete rewrite with the new design:

**Key Components:**
- **Header**: Title "Companies and Startups" with subtitle
- **Search Bar**: Full-width search input
- **Tab Navigation**: All Companies | Product Based | Service Based | Startup | Hiring | Favorites
- **Company List**: Table-style numbered list with hover effects
- **Pagination**: Page numbers with Previous/Next navigation

**State Management:**
- `searchQuery` for filtering
- `activeTab` for category filtering
- `currentPage` for pagination
- `favorites` persisted in localStorage (like Position Resources)

**Pagination Logic:**
- 10 companies per page
- Show page numbers: 1, 2, 3, 4, 5, ..., 15
- Previous/Next buttons

---

### 3. Component Structure

```text
CompanyResources
├── Header (title + subtitle)
├── Search Input
├── Tab Navigation
│   ├── All Companies
│   ├── Product Based
│   ├── Service Based
│   ├── Startup
│   ├── Hiring
│   └── Favorites
├── Company List
│   └── CompanyRow (for each company)
│       ├── # (index)
│       ├── Company Name (bold)
│       ├── Description (text)
│       └── Category Badge
└── Pagination
    ├── Page Numbers
    └── Previous/Next Buttons
```

---

### 4. Styling Approach

**List Row Design:**
- Clean border-bottom separator
- Subtle hover effect (muted background)
- Number column: minimal width, muted color
- Company info: flex column with name + description
- Category badge: outline style with category-specific colors

**Category Color Mapping:**
```typescript
const categoryColors: Record<string, string> = {
  "FinTech": "text-green-500 border-green-500/30",
  "AI/Technology": "text-blue-500 border-blue-500/30",
  "E-commerce/Technology": "text-purple-500 border-purple-500/30",
  "Technology": "text-cyan-500 border-cyan-500/30",
  "Media Tech": "text-pink-500 border-pink-500/30",
  "Health & Wellness": "text-emerald-500 border-emerald-500/30",
  "EV/Mobility": "text-orange-500 border-orange-500/30",
  // ... more categories
};
```

**Tab Design:**
- Unstyled text tabs with hover effect
- No background, just text
- Active tab: slightly bolder or underline

---

### 5. Features to Implement

1. **Search**: Filter by company name or description
2. **Tab Filtering**: 
   - All Companies: Show all
   - Product Based: Filter by type includes "product"
   - Service Based: Filter by type includes "service"
   - Startup: Filter by type includes "startup"
   - Hiring: Filter by isHiring === true
   - Favorites: Show starred companies
3. **Favorites System**: Star icon to save favorites (localStorage)
4. **Pagination**: Client-side pagination, 10 items per page
5. **Click to Navigate**: Each row links to company detail page (future)

---

### 6. Responsive Design

**Desktop (lg+):**
- Full table layout with all columns visible
- Pagination with multiple page numbers

**Tablet (md):**
- Condensed description (truncated)
- Fewer page numbers shown

**Mobile (sm):**
- Stack company info vertically
- Category badge below description
- Simplified pagination (Prev/Next only)

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/data/companyResourcesData.ts` | Create | Company data with types, categories, descriptions |
| `src/pages/library/CompanyResources.tsx` | Rewrite | New tabular design with all features |

---

## Sample Company Data (to include 50+ companies)

Categories to include:
- FAANG (Google, Amazon, Apple, Meta, Netflix, Microsoft)
- FinTech (Acko, Razorpay, PhonePe, Paytm, CRED)
- E-commerce (Flipkart, Myntra, Meesho, Nykaa)
- AI/Technology (Ai.tech, OpenAI ecosystem companies)
- Startups (Zepto, Swiggy, Zomato, Ola, Uber)
- Service-based (TCS, Infosys, Wipro, Cognizant)
- Product companies (Atlassian, Salesforce, Adobe)
- EV/Mobility (Ather, Ola Electric)
- Recruitment (Apna, Naukri, LinkedIn)

---

## Visual Preview

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  Companies and Startups                                                  │
│  Select a company to explore all available resources and preparation     │
├──────────────────────────────────────────────────────────────────────────┤
│  🔍 Search companies...                                                  │
├──────────────────────────────────────────────────────────────────────────┤
│  All Companies  │  Product Based  │  Service Based  │  Startup  │  ...   │
├──────────────────────────────────────────────────────────────────────────┤
│  #  │  Company                                                │ Category │
├──────────────────────────────────────────────────────────────────────────┤
│  1  │  Acko Insurance                                         │ FinTech  │
│     │  An independent, digital-first general insurance...     │          │
├──────────────────────────────────────────────────────────────────────────┤
│  2  │  Ai.tech                                                │ AI/Tech  │
│     │  An AI and machine learning platform specializing...    │          │
├──────────────────────────────────────────────────────────────────────────┤
│                    ◀ 1  2  3  4  5  ...  15  Next ▶                      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Future Enhancements (Not in this implementation)

- Company detail page with specific resources
- Interview experiences per company
- Salary insights
- Company ratings
