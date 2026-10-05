const PASSWORD_RULES = [
    {
        test: (password) => password.length >= 8,
        message: "This password is too short. It must contain at least 8 characters.",
    },
    {
        test: (password) => /[a-z]/.test(password),
        message: "The password must contain at least one lowercase letter.",
    },
    {
        test: (password) => /[A-Z]/.test(password),
        message: "The password must contain at least one uppercase letter.",
    },
    {
        test: (password) => /[0-9]/.test(password),
        message: "The password must contain at least one number.",
    },
    {
        test: (password) => /[^a-zA-Z0-9]/.test(password),
        message: "The password must contain at least one special character.",
    },
];

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

export const validatePassword = (password, attributes) => {
    const failedRule = PASSWORD_RULES.find((rule) => !rule.test(password));
    if (failedRule) return failedRule.message;

    const lowerPassword = password.toLowerCase();
    const similarAttribute = getSimilarityAttributes(attributes).find(
        ({ value }) => value.length >= 3 && lowerPassword.includes(value.toLowerCase())
    );
    if (similarAttribute) {
        return `The password is too similar to your ${similarAttribute.label}.`;
    }

    return null;
};
