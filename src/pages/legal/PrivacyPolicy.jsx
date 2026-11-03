import LegalLayout from "./LegalLayout";

const sections = [
  {
    id: "introduction",
    title: "Introduction",
    body: (
      <>
        <p>
          SnapSumbong is committed to protecting the privacy and personal information of its
          users. This Privacy Policy explains how personal information is collected, used,
          stored, and protected when using the Road Hazard Reporting and Monitoring System.
        </p>
        <p>
          This policy is implemented in accordance with the Data Privacy Act of 2012 (Republic
          Act No. 10173) and its Implementing Rules and Regulations.
        </p>
      </>
    ),
  },
  {
    id: "information-we-collect",
    title: "Information We Collect",
    body: (
      <>
        <p>The system may collect the following information:</p>
        <ul>
          <li>Full name</li>
          <li>Email address</li>
          <li>Contact number</li>
          <li>User account credentials</li>
          <li>Road hazard reports</li>
          <li>Uploaded images and supporting documents</li>
          <li>Geographic location of reported hazards</li>
          <li>Date, time, and status of reports</li>
          <li>System activity logs</li>
        </ul>
      </>
    ),
  },
  {
    id: "purpose-of-collection",
    title: "Purpose of Collection",
    body: (
      <>
        <p>Collected information is used for:</p>
        <ul>
          <li>Account registration and authentication</li>
          <li>Submission and management of road hazard reports</li>
          <li>Validation and investigation of reported hazards</li>
          <li>Communication regarding report updates</li>
          <li>System monitoring and maintenance</li>
          <li>Statistical and operational reporting</li>
        </ul>
      </>
    ),
  },
  {
    id: "access-to-information",
    title: "Access to Information",
    body: (
      <>
        <p>Access to personal information is limited to:</p>
        <ul>
          <li>The reporting citizen</li>
          <li>Authorized LGU administrators</li>
          <li>Authorized personnel responsible for hazard management</li>
        </ul>
        <p>
          Information shall not be shared with unauthorized individuals or organizations unless
          required by law.
        </p>
      </>
    ),
  },
  {
    id: "user-rights",
    title: "User Rights",
    body: (
      <>
        <p>Users have the right to:</p>
        <ul>
          <li>Be informed regarding the processing of their data</li>
          <li>Access their personal information</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of information when legally permissible</li>
          <li>Withdraw consent where applicable</li>
        </ul>
      </>
    ),
  },
  {
    id: "security-measures",
    title: "Security Measures",
    body: (
      <>
        <p>The system employs reasonable technical and organizational safeguards, including:</p>
        <ul>
          <li>Password encryption</li>
          <li>Role-based access controls</li>
          <li>Secure database storage</li>
          <li>Activity logging</li>
          <li>Regular system maintenance and monitoring</li>
        </ul>
      </>
    ),
  },
  {
    id: "changes-to-this-policy",
    title: "Changes To This Policy",
    body: (
      <p>
        The LGU reserves the right to update this Privacy Policy when necessary. Users will be
        notified of significant changes.
      </p>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="How SnapSumbong collects, uses, stores, and protects your personal information."
      sections={sections}
    />
  );
}
