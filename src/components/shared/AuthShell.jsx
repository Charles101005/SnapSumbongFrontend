import AuthFooter from "./AuthFooter";
import "./auth.css";

/**
 * Shared frame for the public auth screens (login, register, forgot password,
 * email verification, and set-new-password). Keeps the logo, wordmark,
 * background, and footer identical across every step of the flows.
 */
export default function AuthShell({ subtitle, children }) {
  return (
    <div className="auth-page">
      <div className="auth-bg" aria-hidden="true">
        <span className="auth-blob auth-blob-1" />
        <span className="auth-blob auth-blob-2" />
      </div>

      <main className="auth-wrapper">
        <header className="auth-header">
          <div className="auth-logo">
            <img src="/SnapSumbongLogo.png" alt="SnapSumbong" className="brand-logo-img" />
          </div>
          <h1 className="auth-title">SnapSumbong</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        </header>

        {children}
      </main>

      <AuthFooter />
    </div>
  );
}
