import { Link, useLocation } from "react-router-dom";
import AuthFooter from "../../components/shared/AuthFooter";
import { LAST_UPDATED, LEGAL_POLICIES } from "./policies";
import "./LegalLayout.css";

/**
 * Shared frame for the public legal pages (Privacy Policy, Terms and
 * Conditions, Acceptable Use and Reporting Policy). Keeps the brand header,
 * table of contents, related-document navigation, and footer identical across
 * all three documents.
 */
export default function LegalLayout({ title, description, sections }) {
  const { pathname } = useLocation();

  return (
    <div className="legal-page">
      <div className="legal-bg" aria-hidden="true">
        <span className="legal-blob legal-blob-1" />
        <span className="legal-blob legal-blob-2" />
      </div>

      <header className="legal-topbar">
        <Link to="/" className="legal-brand">
          <img src="/SnapSumbongLogo.png" alt="" className="legal-brand-logo" />
          <span>SnapSumbong</span>
        </Link>
      </header>

      <main className="legal-main">
        <div className="legal-hero">
          <h1 className="legal-title">{title}</h1>
          <p className="legal-description">{description}</p>
          <p className="legal-updated">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="legal-layout">
          <aside className="legal-aside">
            <nav className="legal-toc" aria-label="On this page">
              <p className="legal-toc-title">On this page</p>
              <ol>
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>
                      <span className="legal-toc-num" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>{section.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <nav className="legal-related" aria-label="Other policies">
              <p className="legal-related-title">Related documents</p>
              <ul>
                {LEGAL_POLICIES.map((policy) => (
                  <li key={policy.slug}>
                    <Link
                      to={policy.path}
                      aria-current={pathname === policy.path ? "page" : undefined}
                    >
                      {policy.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <article className="legal-card">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="legal-section">
                <h2 className="legal-section-title">
                  <span className="legal-section-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  {section.title}
                </h2>
                <div className="legal-section-body">{section.body}</div>
              </section>
            ))}
          </article>
        </div>
      </main>

      <AuthFooter showPolicies={false} />
    </div>
  );
}
