// DO 47 s.2024 SLA helpers. The backend exposes `due_at` (ISO string or null)
// and `is_overdue` (boolean) on report list/detail responses.

// Local-calendar (non-UTC) date comparison helpers. due_at arrives as a UTC
// ISO string; we only care about day-level granularity for display.
const startOfLocalDay = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

// Whole days remaining until due_at (negative = days overdue). 0 = due today.
export const daysRemaining = (dueAt) => {
    if (!dueAt) return null;
    const due = new Date(dueAt);
    if (Number.isNaN(due.getTime())) return null;
    return Math.round((startOfLocalDay(due) - startOfLocalDay(new Date())) / 86400000);
};

export const isOverdue = (report) => Boolean(report?.is_overdue);

export const formatDueDate = (dueAt) => {
    if (!dueAt) return "—";
    const due = new Date(dueAt);
    if (Number.isNaN(due.getTime())) return "—";
    return due.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

// Human label for a report's SLA state:
//   { tone: 'ok'|'soon'|'overdue'|'none', text: string }
export const slaBadge = (report) => {
    const dueAt = report?.due_at;
    if (!dueAt) return { tone: "none", text: "No SLA" };

    const days = daysRemaining(dueAt);

    if (isOverdue(report)) {
        const overdueBy = days === null ? null : Math.abs(days);
        return {
            tone: "overdue",
            text: overdueBy === null ? "Overdue" : `Overdue ${overdueBy}d`,
        };
    }

    if (days === null) return { tone: "none", text: "No SLA" };
    // Past due but not flagged overdue by the backend: the SLA clock is no
    // longer live (closed/resolved/invalid reports). Show a neutral dash
    // instead of a misleading negative countdown.
    if (days < 0) return { tone: "none", text: "—" };
    if (days === 0) return { tone: "soon", text: "Due today" };
    if (days <= 2) return { tone: "soon", text: `${days}d left` };
    return { tone: "ok", text: `${days}d left` };
};
