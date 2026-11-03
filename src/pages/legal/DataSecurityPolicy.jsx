import LegalLayout from "./LegalLayout";

const sections = [
  {
    id: "purpose",
    title: "Purpose",
    body: (
      <p>
        The purpose of this policy is to ensure the confidentiality, integrity, and availability of
        information stored within the system.
      </p>
    ),
  },
  {
    id: "access-control",
    title: "Access Control",
    body: (
      <>
        <p>System access shall be restricted according to assigned roles:</p>
        <ul>
          <li>Citizen Users</li>
          <li>LGU Personnel</li>
          <li>System Administrators</li>
        </ul>
        <p>Users shall only access information necessary for their responsibilities.</p>
      </>
    ),
  },
  {
    id: "authentication-security",
    title: "Authentication Security",
    body: (
      <>
        <p>The system shall implement:</p>
        <ul>
          <li>Password protection</li>
          <li>Encrypted password storage</li>
          <li>Session management controls</li>
        </ul>
      </>
    ),
  },
  {
    id: "system-security-measures",
    title: "System Security Measures",
    body: (
      <>
        <p>Security measures include:</p>
        <ul>
          <li>Secure communication protocols (HTTPS)</li>
          <li>Database protection mechanisms</li>
          <li>Access logging and monitoring</li>
          <li>Regular software updates</li>
          <li>Data backup procedures</li>
        </ul>
      </>
    ),
  },
  {
    id: "incident-response",
    title: "Incident Response",
    body: (
      <>
        <p>
          In the event of unauthorized access, data loss, or security breaches, administrators
          shall:
        </p>
        <ul>
          <li>Identify the incident.</li>
          <li>Contain affected systems.</li>
          <li>Investigate the cause.</li>
          <li>Restore affected services.</li>
          <li>Implement preventive measures.</li>
        </ul>
      </>
    ),
  },
  {
    id: "staff-responsibilities",
    title: "Staff Responsibilities",
    body: (
      <>
        <p>Authorized personnel are responsible for:</p>
        <ul>
          <li>Protecting account credentials</li>
          <li>Maintaining confidentiality of data</li>
          <li>Reporting security incidents immediately</li>
        </ul>
      </>
    ),
  },
];

export default function DataSecurityPolicy() {
  return (
    <LegalLayout
      title="Data Security Policy"
      description="The access, authentication, and system safeguards that protect information stored in SnapSumbong."
      sections={sections}
    />
  );
}
