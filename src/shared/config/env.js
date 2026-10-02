// Shared runtime configuration for the frontend.

// Mock access control switch.
// When true, sidebar/module visibility ignores user.permissions so every
// staff member sees every section (demo/development convenience).
// Production: set to false (or wire to import.meta.env.VITE_MOCK_ALL_ACCESS)
// so access is driven by the permissions returned by accounts/auth/user/.
export const MOCK_ALL_ACCESS = true;
