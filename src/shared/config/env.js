// Shared runtime configuration for the frontend.

// Mock access control switch.
// When true, sidebar/module visibility ignores user.permissions so every
// staff member sees every section (demo/development convenience).
// When false, access is driven by the permissions returned by
// accounts/auth/user/ — the Sidebar hides sections and RequirePermission
// blocks direct URL access to routes the user lacks permission for.
export const MOCK_ALL_ACCESS = false;
