const STORAGE_KEY = "snapsumbong.authFlow";

export function setAuthFlow(partial) {
    const current = getAuthFlow() || {};
    const next = { ...current, ...partial };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
}

export function getAuthFlow() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function clearAuthFlow() {
    sessionStorage.removeItem(STORAGE_KEY);
}
