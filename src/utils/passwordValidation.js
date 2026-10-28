const PASSWORD_RULES = [
    {
        label: "At least 8 characters",
        test: (password) => password.length >= 8,
        message: "This password is too short. It must contain at least 8 characters.",
    },
    {
        label: "One lowercase letter",
        test: (password) => /[a-z]/.test(password),
        message: "The password must contain at least one lowercase letter.",
    },
    {
        label: "One uppercase letter",
        test: (password) => /[A-Z]/.test(password),
        message: "The password must contain at least one uppercase letter.",
    },
    {
        label: "One number",
        test: (password) => /[0-9]/.test(password),
        message: "The password must contain at least one number.",
    },
    {
        label: "One special character",
        test: (password) => /[^a-zA-Z0-9]/.test(password),
        message: "The password must contain at least one special character.",
    },
];

const SIMILARITY_RULE = {
    label: "Not similar to your name or email",
    message: (attribute) => `The password is too similar to your ${attribute.label}.`,
};

const getSimilarityAttributes = ({ email, firstName, lastName } = {}) => {
    const attributes = [];

    if (email) {
        const localPart = email.split("@")[0];
        if (localPart) attributes.push({ label: "email address", value: localPart });
    }
    if (firstName) attributes.push({ label: "first name", value: firstName });
    if (lastName) attributes.push({ label: "last name", value: lastName });

    return attributes;
};

// Returns the first similarity attribute the password collides with, or
// null when the password is sufficiently distinct.
const findSimilarAttribute = (password, attributes) => {
    const lowerPassword = password.toLowerCase();
    return (
        getSimilarityAttributes(attributes).find(
            ({ value }) => value.length >= 3 && lowerPassword.includes(value.toLowerCase())
        ) || null
    );
};

export const validatePassword = (password, attributes) => {
    const failedRule = PASSWORD_RULES.find((rule) => !rule.test(password));
    if (failedRule) return failedRule.message;

    const similarAttribute = findSimilarAttribute(password, attributes);
    if (similarAttribute) return SIMILARITY_RULE.message(similarAttribute);

    return null;
};

// Per-rule pass/fail statuses for the live requirements checklist in the
// Change Password form. The `attributes` argument mirrors validatePassword's
// (email/firstName/lastName) for the similarity rule.
export const getPasswordRuleStatuses = (password = "", attributes = {}) => {
    const similarAttribute = findSimilarAttribute(password, attributes);
    return [
        ...PASSWORD_RULES.map(({ label, test, message }) => ({
            label,
            passed: test(password),
            message,
        })),
        {
            label: SIMILARITY_RULE.label,
            passed: !similarAttribute,
            message: similarAttribute ? SIMILARITY_RULE.message(similarAttribute) : "",
        },
    ];
};
