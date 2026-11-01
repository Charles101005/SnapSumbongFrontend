import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../../api/register";
import { setAuthFlow } from "../../../shared/authFlowStorage";
import { mapApiErrors } from "../../../utils/apiErrors";
import { validatePassword } from "../../../utils/passwordValidation";
import AuthShell from "../../../components/shared/AuthShell";
import PasswordChecklist from "../../../components/shared/PasswordChecklist";
import {
    AlertIcon,
    ArrowRightIcon,
    EyeIcon,
    EyeOffIcon,
    LockIcon,
    LogInIcon,
    MailIcon,
    SpinnerIcon,
} from "../../../components/shared/icons";

export default function Register() {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [middleName, setMiddleName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Trim before validating so whitespace-only input doesn't count as filled.
    const values = () => ({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleName: middleName.trim(),
        email: email.trim(),
    });

    // Drop a field's error (and stale server-side form error) as soon as the
    // user starts editing it, so messages don't linger after a fix.
    const clearFieldError = (field) => {
        setErrors((prev) => {
            if (!prev[field] && !prev.form) return prev;
            const next = { ...prev };
            delete next[field];
            delete next.form;
            return next;
        });
    };

    const validate = () => {
        const newErrors = {};
        const { firstName: first, lastName: last, email: mail } = values();
        if (!first) newErrors.firstName = "First name is required";
        if (!last) newErrors.lastName = "Last name is required";
        if (!mail) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(mail)) newErrors.email = "Enter a valid email address.";
        if (!password) newErrors.password = "Password is required";
        else {
            const passwordError = validatePassword(password, { email: mail, firstName: first, lastName: last });
            if (passwordError) newErrors.password = passwordError;
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const { firstName: first, lastName: last, middleName: middle, email: mail } = values();

        setErrors({});
        setSubmitting(true);
        try {
            await registerUser(mail, password, last, first, middle || null);
            // account is created as "pending" until OTP verification
            setAuthFlow({ email: mail, purpose: "register", otp: null });
            navigate("/verify-email", { state: { email: mail } });
        } catch (err) {
            // err is the response body, so map field errors from DRF
            // ({"email": [...]}) and domain errors ({"detail", "error_code"}).
            setErrors(mapApiErrors(err, {
                fields: {
                    email: "email",
                    password: "password",
                    first_name: "firstName",
                    last_name: "lastName",
                    middle_name: "middleName",
                },
                codes: {
                    VERIFICATION_IN_PROGRESS: "email",
                },
            }));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthShell subtitle="Join your community reporting platform">
            <section className="auth-card" aria-labelledby="register-heading">
                <div className="auth-card-header">
                    <h2 id="register-heading" className="auth-card-title">Create your account</h2>
                    <p className="auth-card-subtitle">
                        A few details and you're ready to report hazards in your community.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    {errors.form && (
                        <div className="auth-alert" role="alert">
                            <AlertIcon size={16} />
                            <span>{errors.form}</span>
                        </div>
                    )}

                    <div className="auth-field-row">
                        <div className="auth-field">
                            <label htmlFor="firstName" className="auth-label">First name</label>
                            <input
                                id="firstName"
                                type="text"
                                value={firstName}
                                onChange={(e) => {
                                    setFirstName(e.target.value);
                                    clearFieldError("firstName");
                                }}
                                placeholder="First name"
                                className={`auth-input ${errors.firstName ? "auth-input--error" : ""}`}
                                autoComplete="given-name"
                                aria-invalid={Boolean(errors.firstName)}
                                aria-describedby={errors.firstName ? "firstName-error" : undefined}
                            />
                            {errors.firstName && <p id="firstName-error" className="auth-error">{errors.firstName}</p>}
                        </div>

                        <div className="auth-field">
                            <label htmlFor="lastName" className="auth-label">Last name</label>
                            <input
                                id="lastName"
                                type="text"
                                value={lastName}
                                onChange={(e) => {
                                    setLastName(e.target.value);
                                    clearFieldError("lastName");
                                }}
                                placeholder="Last name"
                                className={`auth-input ${errors.lastName ? "auth-input--error" : ""}`}
                                autoComplete="family-name"
                                aria-invalid={Boolean(errors.lastName)}
                                aria-describedby={errors.lastName ? "lastName-error" : undefined}
                            />
                            {errors.lastName && <p id="lastName-error" className="auth-error">{errors.lastName}</p>}
                        </div>
                    </div>

                    <div className="auth-field">
                        <label htmlFor="middleName" className="auth-label">
                            Middle name <span className="auth-optional">(optional)</span>
                        </label>
                        <input
                            id="middleName"
                            type="text"
                            value={middleName}
                            onChange={(e) => {
                                setMiddleName(e.target.value);
                                clearFieldError("middleName");
                            }}
                            placeholder="Middle name"
                            className={`auth-input ${errors.middleName ? "auth-input--error" : ""}`}
                            autoComplete="additional-name"
                            aria-invalid={Boolean(errors.middleName)}
                            aria-describedby={errors.middleName ? "middleName-error" : undefined}
                        />
                        {errors.middleName && <p id="middleName-error" className="auth-error">{errors.middleName}</p>}
                    </div>

                    <div className="auth-field">
                        <label htmlFor="email" className="auth-label">Email address</label>
                        <div className="auth-input-wrap">
                            <span className="auth-input-icon" aria-hidden="true">
                                <MailIcon size={16} />
                            </span>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    clearFieldError("email");
                                }}
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
                        <label htmlFor="password" className="auth-label">Password</label>
                        <div className="auth-input-wrap">
                            <span className="auth-input-icon" aria-hidden="true">
                                <LockIcon size={16} />
                            </span>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    clearFieldError("password");
                                }}
                                placeholder="Create a password"
                                className={`auth-input auth-input--icon auth-input--toggle ${errors.password ? "auth-input--error" : ""}`}
                                autoComplete="new-password"
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
                        <p className="auth-hint">
                            Use 8+ characters with uppercase, lowercase, a number, and a symbol.
                        </p>
                        <PasswordChecklist
                            password={password}
                            identity={{
                                email: email.trim(),
                                firstName: firstName.trim(),
                                lastName: lastName.trim(),
                            }}
                        />
                    </div>

                    <button type="submit" className="auth-submit" disabled={submitting}>
                        {submitting ? (
                            <>
                                <SpinnerIcon size={16} className="auth-spinner" />
                                Creating account...
                            </>
                        ) : (
                            <>
                                Create account
                                <ArrowRightIcon size={16} />
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>Already have an account?</span>
                </div>

                <Link to="/" className="auth-secondary">
                    Log in
                    <LogInIcon size={16} />
                </Link>
            </section>
        </AuthShell>
    );
}
