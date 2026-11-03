import { CONSENT_POLICIES } from "../../pages/legal/policies";
import "./AuthFooter.css";

/**
 * Shared footer for the public auth screens (login, register, password reset).
 * Rendered at the bottom of the page so it never crowds the centered form.
 * Policy links open in a new tab so a half-filled form is never lost.
 */
export default function AuthFooter({ showPolicies = true }) {
  return (
    <footer className="auth-footer">
      {showPolicies && (
        <nav className="auth-footer-links" aria-label="Policies and terms">
          {CONSENT_POLICIES.map((policy) => (
            <a
              key={policy.slug}
              href={policy.path}
              target="_blank"
              rel="noopener noreferrer"
            >
              {policy.label}
            </a>
          ))}
        </nav>
      )}

      <p className="auth-footer-contact">
        Need help? Email us at{" "}
        <a href="mailto:support@snapsumbong.site">support@snapsumbong.site</a>
      </p>
      <p className="auth-footer-text">
        &copy; {new Date().getFullYear()} SnapSumbong. All rights reserved.
      </p>
    </footer>
  );
}
