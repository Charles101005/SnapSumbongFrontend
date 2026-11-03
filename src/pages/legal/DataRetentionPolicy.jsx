import LegalLayout from "./LegalLayout";

const RETENTION_SCHEDULE = [
  ["Active user accounts", "While accounts remain active"],
  ["Closed citizen accounts", "Up to 2 years after deactivation"],
  ["Hazard Reports", "Up to 5 years of closure"],
  ["Report images and attachments", "Same period as associated report"],
  ["Audit Logs", "Up to 3 years"],
  ["Backup data", "Up to 90 days"],
];

const sections = [
  {
    id: "purpose",
    title: "Purpose",
    body: (
      <p>
        This policy establishes guidelines for retaining and disposing of information collected
        through SnapSumbong.
      </p>
    ),
  },
  {
    id: "retention-principles",
    title: "Retention Principles",
    body: (
      <p>
        Personal information shall be retained only for as long as necessary to fulfill legitimate
        operational, legal, and administrative purposes, consistent with the Data Privacy Act of
        2012.
      </p>
    ),
  },
  {
    id: "retention-schedules",
    title: "Retention Schedules",
    body: (
      <div className="legal-table-wrap">
        <table className="legal-table">
          <thead>
            <tr>
              <th scope="col">Information Type</th>
              <th scope="col">Retention Period</th>
            </tr>
          </thead>
          <tbody>
            {RETENTION_SCHEDULE.map(([type, period]) => (
              <tr key={type}>
                <th scope="row">{type}</th>
                <td>{period}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: "disposals",
    title: "Disposals",
    body: (
      <>
        <p>Upon expiration of the retention period, records shall be:</p>
        <ul>
          <li>Securely deleted</li>
          <li>Permanently removed from storage systems</li>
          <li>Anonymized where necessary for statistical purposes</li>
        </ul>
      </>
    ),
  },
  {
    id: "exceptions",
    title: "Exceptions",
    body: (
      <>
        <p>Data may be retained beyond the stated periods when:</p>
        <ul>
          <li>Required by law</li>
          <li>Needed for investigations</li>
          <li>Necessary for legal claims or proceedings</li>
        </ul>
      </>
    ),
  },
];

export default function DataRetentionPolicy() {
  return (
    <LegalLayout
      title="Data Retention Policy"
      description="How long SnapSumbong keeps information, and how records are disposed of once that period ends."
      sections={sections}
    />
  );
}
