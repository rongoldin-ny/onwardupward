export const ROLE_TYPES = [
  { value: "product_design", label: "Product Design" },
  { value: "content_design", label: "Content Design" },
  { value: "user_research", label: "User Research" },
  { value: "product_management", label: "Product Management" },
];

export const CAREER_STAGES = [
  { value: "early_ic", label: "Early IC" },
  { value: "mid_ic", label: "Mid career IC" },
  { value: "senior_ic", label: "Senior+ IC" },
  { value: "early_management", label: "Early Management" },
  { value: "senior_management", label: "Senior Management" },
  { value: "director_plus", label: "Director+ / VP / C-Suite" },
];

export const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina",
  "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados",
  "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana",
  "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon",
  "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark",
  "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador",
  "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea",
  "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia",
  "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan",
  "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia",
  "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia",
  "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico",
  "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria",
  "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama",
  "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
  "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines",
  "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia",
  "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
  "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname",
  "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste",
  "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda",
  "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
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
  return ROLE_TYPES.find((r) => r.value === value)?.label ?? "Product Design";
}

export function labelForCareerStage(value: string | null): string {
  return CAREER_STAGES.find((s) => s.value === value)?.label ?? "";
}

/** Company chips: each employer once (case-insensitive), first spelling wins. */
export function uniqueCompanies(names: (string | null | undefined)[], limit = 3): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    const trimmed = name?.trim();
    if (!trimmed || seen.has(trimmed.toLowerCase())) continue;
    seen.add(trimmed.toLowerCase());
    out.push(trimmed);
    if (out.length >= limit) break;
  }
  return out;
}
