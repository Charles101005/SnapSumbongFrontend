// Single source of truth for the public legal documents. Used by the legal
// page layout, the auth footer, and the registration consent checkboxes so
// every link points at the same route.
export const LAST_UPDATED = "November 3, 2026";

// Documents a user agrees to when creating an account.
export const CONSENT_POLICIES = [
  {
    slug: "privacy-policy",
    path: "/privacy-policy",
    label: "Privacy Policy",
    description: "How we collect, use, and protect your personal information.",
  },
  {
    slug: "terms-and-conditions",
    path: "/terms-and-conditions",
    label: "Terms and Conditions",
    description: "The rules and responsibilities that apply when using SnapSumbong.",
  },
  {
    slug: "acceptable-use-policy",
    path: "/acceptable-use-policy",
    label: "Acceptable Use and Reporting Policy",
    description: "What you may report, how reports are reviewed, and how misuse is handled.",
  },
];

// Every legal document, including operational policies shown in Account
// Settings under "Legal & Policies".
export const LEGAL_POLICIES = [
  ...CONSENT_POLICIES,
  {
    slug: "data-retention-policy",
    path: "/data-retention-policy",
    label: "Data Retention Policy",
    description: "How long records are kept and how they are securely disposed of.",
  },
  {
    slug: "data-security-policy",
    path: "/data-security-policy",
    label: "Data Security Policy",
    description: "The safeguards that protect the confidentiality and integrity of your data.",
  },
];
