export const ROLE_TYPES = [
  { value: "designer", label: "Product Designer" },
  { value: "design_management", label: "Design Management" },
  { value: "pm_ic", label: "Product Manager (IC)" },
  { value: "pm_manager", label: "Product Management Lead" },
  { value: "content_designer", label: "Content Designer" },
  { value: "ux_researcher", label: "UX Researcher" },
];

export const CAREER_STAGES = [
  { value: "early", label: "Early" },
  { value: "mid", label: "Mid-career" },
  { value: "senior", label: "Senior+" },
  { value: "director", label: "Director+" },
];

export const COUNTRIES = [
  "Australia", "Brazil", "Canada", "Denmark", "France", "Germany", "India", "Ireland",
  "Japan", "Netherlands", "New Zealand", "Norway", "Portugal", "Singapore", "Spain",
  "Sweden", "Switzerland", "United Kingdom", "United States",
].map((c) => ({ value: c, label: c }));

export const INDUSTRIES = [
  "Fintech",
  "Payments",
  "B2B",
  "SaaS",
  "Consumer",
  "E-commerce",
  "Retail",
  "Marketplaces",
  "Food & Beverage",
  "Hardware",
  "Wearables",
  "Search",
  "AI",
  "Healthcare",
  "Fitness",
  "Enterprise",
  "Productivity",
  "Developer Tools",
  "Social",
  "Media",
  "Gaming",
  "Music",
  "Travel",
  "Mobility",
  "Logistics",
  "Real Estate",
  "Insurance",
  "Crypto",
  "Edtech",
];

export function labelForRoleType(value: string | null): string {
  return ROLE_TYPES.find((r) => r.value === value)?.label ?? "Product Designer";
}

export function labelForCareerStage(value: string | null): string {
  return CAREER_STAGES.find((s) => s.value === value)?.label ?? "";
}
