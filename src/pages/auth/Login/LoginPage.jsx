import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../../../api/login";
import { getCurrentUser } from "../../../api/accounts";
import { setAccessToken } from "../../../api/authToken";
import { useAuth, homePathFor } from "../../../context/authContext";
import AuthShell from "../../../components/shared/AuthShell";
import {
  AlertIcon,
  ArrowRightIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  LogInIcon,
  MailIcon,
  SpinnerIcon,
} from "../../../components/shared/icons";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, user, setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(
    location.state?.justVerified
      ? "Email verified — your account is ready. Please log in to continue."
      : location.state?.justResetPassword
        ? "Password updated — log in with your new password."
        : null
  );

  useEffect(() => {
    if (status === "authenticated" && user) {
      navigate(homePathFor(user), { replace: true });
    }
  }, [status, user, navigate]);

  const validate = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Enter a valid email address.";
    }
    if (!password) {
      newErrors.password = "Password is required";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const data = await loginUser(email, password);
      setAccessToken(data.access);

      // The login response only establishes authentication. Fetch the current
      // user so we can route staff and citizens to their respective portals.
      const currentUser = await getCurrentUser();
      setSession(currentUser);

      navigate(homePathFor(currentUser), { replace: true });
    } catch (err) {
      setErrors({ form: err?.detail || err?.message || "Invalid email or password." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell subtitle="Community Hazard Reporting Portal">
      <section className="auth-card" aria-labelledby="login-heading">
        <div className="auth-card-header">
          <h2 id="login-heading" className="auth-card-title">Welcome back</h2>
          <p className="auth-card-subtitle">Log in to continue to your account.</p>
        </div>

        {notice && (
          <div className="auth-notice" role="status">
            <CheckIcon size={16} />
            <span>{notice}</span>
            <button
              type="button"
              className="auth-notice-dismiss"
              onClick={() => setNotice(null)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-field">
            <label htmlFor="email" className="auth-label">
              Email address
            </label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon" aria-hidden="true">
                <MailIcon size={16} />
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={`auth-input auth-input--icon ${errors.email ? "auth-input--error" : ""}`}
                autoComplete="email"
                inputMode="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
            </div>
            {errors.email && <p id="email-error" className="auth-error">{errors.email}</p>}
          </div>

          <div className="auth-field">
            <div className="auth-label-row">
              <label htmlFor="password" className="auth-label">
                Password
              </label>
              <Link to="/forgot-password" className="auth-link auth-link--small">
                Forgot password?
              </Link>
            </div>
            <div className="auth-input-wrap">
              <span className="auth-input-icon" aria-hidden="true">
                <LockIcon size={16} />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`auth-input auth-input--icon auth-input--toggle ${errors.password ? "auth-input--error" : ""}`}
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              <button
                type="button"
                className="auth-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
            {errors.password && <p id="password-error" className="auth-error">{errors.password}</p>}
          </div>

          {errors.form && (
            <div className="auth-alert" role="alert">
              <AlertIcon size={16} />
              <span>{errors.form}</span>
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? (
              <>
                <SpinnerIcon size={16} className="auth-spinner" />
                Logging in...
              </>
            ) : (
              <>
                Log in
                <LogInIcon size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>New to SnapSumbong?</span>
        </div>

        <Link to="/register" className="auth-secondary">
          Create an account
          <ArrowRightIcon size={16} />
        </Link>
      </section>
    </AuthShell>
  );
}
