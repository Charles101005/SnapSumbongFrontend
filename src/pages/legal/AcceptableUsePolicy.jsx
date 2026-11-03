import LegalLayout from "./LegalLayout";
import { AlertIcon } from "../../components/shared/icons";

const sections = [
  {
    id: "purpose",
    title: "Purpose",
    body: (
      <p>This policy governs the proper submission of road hazard reports through the system.</p>
    ),
  },
  {
    id: "acceptable-reports",
    title: "Acceptable Reports",
    body: (
      <>
        <p>Users may report:</p>
        <ul>
          <li>Potholes</li>
          <li>Damaged road surfaces</li>
          <li>Obstructions</li>
          <li>Flooded roads</li>
          <li>Broken road signs</li>
          <li>Road safety hazards</li>
          <li>Other road-related infrastructure issues</li>
        </ul>
      </>
    ),
  },
  {
    id: "report-requirements",
    title: "Report Requirements",
    body: (
      <>
        <p>Reports should include:</p>
        <ul>
          <li>Accurate location information</li>
          <li>Clear descriptions</li>
          <li>Relevant photos when available</li>
          <li>Truthful and complete details</li>
        </ul>
      </>
    ),
  },
  {
    id: "prohibited-reports",
    title: "Prohibited Reports",
    body: (
      <>
        <p>The following are prohibited:</p>
        <ul>
          <li>False reports</li>
          <li>Duplicate spam reports</li>
          <li>Politically motivated reports</li>
          <li>Harassing or defamatory content</li>
          <li>Irrelevant submissions</li>
        </ul>
      </>
    ),
  },
  {
    id: "review-of-reports",
    title: "Review of Reports",
    body: (
      <>
        <p>All reports may undergo verification before action is taken.</p>
        <p>The LGU reserves the right to:</p>
        <ul>
          <li>Reject invalid reports</li>
          <li>Request additional information</li>
          <li>Merge duplicate reports</li>
        </ul>
      </>
    ),
  },
  {
    id: "consequences-of-misuse",
    title: "Consequences of Misuse",
    body: (
      <>
        <p>Users who intentionally misuse the platform may:</p>
        <ul>
          <li>Receive warnings</li>
          <li>Have reports invalidated</li>
          <li>Have accounts suspended or permanently restricted</li>
        </ul>
      </>
    ),
  },
  {
    id: "emergency-situations",
    title: "Emergency Situations",
    body: (
      <>
        <p>This platform is not intended for emergency response.</p>
        <p>
          For urgent emergencies involving public safety, users should contact the appropriate
          emergency services or LGU offices directly.
        </p>
        <div className="legal-callout">
          <AlertIcon size={18} />
          <p>
            <strong>For emergencies, do not wait for an online report.</strong> Contact your local
            emergency hotline or the appropriate LGU office immediately.
          </p>
        </div>
      </>
    ),
  },
];

export default function AcceptableUsePolicy() {
  return (
    <LegalLayout
      title="Acceptable Use and Reporting Policy"
      description="What you may report, the details each report should include, and how misuse is handled."
      sections={sections}
    />
  );
}
