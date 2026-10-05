export const FALLBACK_ERROR = "Something went wrong. Please try again.";

// Maps API error payloads onto state keys so messages render under the input
// that caused them. Handles the system's three error shapes:
//  - domain errors:  { detail, error_code, meta }
//  - DRF validation: { field: ["msg", ...] }
//  - non-JSON payloads (proxy/network error pages) → fallback
// options.fields: { drfKey: "stateKey" }        — DRF field errors
// options.codes:   { ERROR_CODE: "stateKey" }   — domain error_code attribution
export const mapApiErrors = (err, { fields = {}, codes = {} } = {}) => {
  if (!err || typeof err === "string" || Array.isArray(err)) return { form: FALLBACK_ERROR };

  if (typeof err.detail === "string") {
    const field = codes[err.error_code];
    return field ? { [field]: err.detail } : { form: err.detail };
  }

  const mapped = {};
  const formMessages = [];

  for (const [key, value] of Object.entries(err)) {
    const messages = (Array.isArray(value) ? value : [value]).filter((v) => typeof v === "string");
    if (messages.length === 0) continue;
    const field = fields[key];
    if (field) mapped[field] = messages.join(" ");
    else formMessages.push(...messages);
  }

  if (formMessages.length > 0) mapped.form = formMessages.join(" ");
  return Object.keys(mapped).length > 0 ? mapped : { form: FALLBACK_ERROR };
};
