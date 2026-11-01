import "./AuthFooter.css";

/**
 * Shared footer for the public auth screens (login, register, password reset).
 * Rendered at the bottom of the page so it never crowds the centered form.
 */
export default function AuthFooter() {
  return (
    <footer className="auth-footer">
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
