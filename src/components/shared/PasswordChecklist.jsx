import { getPasswordRuleStatuses } from "../../utils/passwordValidation";
import { CheckIcon } from "./icons";

/**
 * Live password requirements list. Renders once the user starts typing so the
 * card stays compact on first load, then ticks each rule as it passes.
 */
export default function PasswordChecklist({ password, identity }) {
  if (!password) return null;

  const statuses = getPasswordRuleStatuses(password, identity);

  return (
    <ul className="auth-rules" aria-label="Password requirements">
      {statuses.map((rule) => (
        <li
          key={rule.label}
          className={`auth-rule${rule.passed ? " auth-rule--passed" : ""}`}
        >
          {rule.passed ? (
            <CheckIcon size={12} />
          ) : (
            <span className="auth-rule-dot" aria-hidden="true" />
          )}
          {rule.label}
        </li>
      ))}
    </ul>
  );
}
