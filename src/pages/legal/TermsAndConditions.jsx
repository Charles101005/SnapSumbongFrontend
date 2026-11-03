import LegalLayout from "./LegalLayout";

const sections = [
  {
    id: "acceptance-of-the-terms",
    title: "Acceptance of the Terms",
    body: (
      <p>
        By creating an account and using SnapSumbong, users agree to comply with these Terms and
        Conditions.
      </p>
    ),
  },
  {
    id: "purpose-of-the-platform",
    title: "Purpose of the Platform",
    body: (
      <p>
        The system is intended exclusively for reporting, tracking, and monitoring road-related
        hazards within the jurisdiction of the LGU.
      </p>
    ),
  },
  {
    id: "user-responsibilities",
    title: "User Responsibilities",
    body: (
      <>
        <p>Users agree to:</p>
        <ul>
          <li>Provide accurate information</li>
          <li>Submit reports in good faith</li>
          <li>Upload genuine and relevant evidence</li>
          <li>Maintain the confidentiality of their account credentials</li>
        </ul>
      </>
    ),
  },
  {
    id: "prohibited-activities",
    title: "Prohibited Activities",
    body: (
      <>
        <p>Users shall not:</p>
        <ul>
          <li>Submit false or misleading reports</li>
          <li>Upload inappropriate, offensive, or unlawful content</li>
          <li>Use the system for harassment or malicious purposes</li>
          <li>Attempt unauthorized access to system data</li>
          <li>Disrupt or interfere with system operations</li>
        </ul>
      </>
    ),
  },
  {
    id: "report-verification",
    title: "Report Verification",
    body: (
      <p>
        Submission of a report does not automatically guarantee action or approval. Reports may
        be reviewed, validated, or rejected by authorized personnel.
      </p>
    ),
  },
  {
    id: "account-suspension",
    title: "Account Suspension",
    body: (
      <>
        <p>
          The LGU reserves the right to suspend or terminate accounts found to be involved in:
        </p>
        <ul>
          <li>Fraudulent reporting</li>
          <li>Misuse of the platform</li>
          <li>Violations of these Terms and Conditions</li>
        </ul>
      </>
    ),
  },
  {
    id: "limitations-of-liability",
    title: "Limitations of Liability",
    body: (
      <p>
        The LGU shall not be held liable for inaccuracies caused by incomplete, false, or
        misleading information provided by users.
      </p>
    ),
  },
];

export default function TermsAndConditions() {
  return (
    <LegalLayout
      title="Terms and Conditions"
      description="The rules and responsibilities that apply when you create an account and use SnapSumbong."
      sections={sections}
    />
  );
}
