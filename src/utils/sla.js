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

// Severity derived from a category's response-time SLA. Buckets follow the
// seeded response times (3, 7, 10, 15, 30 days):
//   <=3 days -> P1, 4-7 -> P2, 8-14 -> P3, 15-29 -> P4, >=30 -> P5
// Returns null when the days value is unusable (caller falls back to a
// manual severity pick).
export const severityFromSla = (days) => {
    if (days === null || days === undefined || days === "") return null;
    const value = Number(days);
    if (!Number.isFinite(value)) return null;
    if (value <= 3) return "P1";
    if (value <= 7) return "P2";
    if (value <= 14) return "P3";
    if (value <= 29) return "P4";
    return "P5";
};

// Whole response-time days for a report: prefers the picked category's
// `response_time_days` (respects an unsaved category correction), falling
// back to `due_at - created_at` when the lookup cannot resolve the category.
// Null when neither source is available.
export const slaDaysForReport = (report, pickedCategoryId, categories) => {
    const option = (categories || []).find(
        (item) => String(item.hazard_id) === String(pickedCategoryId)
    );
    if (option?.response_time_days !== null && option?.response_time_days !== undefined && option?.response_time_days !== "") {
        const days = Number(option.response_time_days);
        if (Number.isFinite(days)) return days;
    }
    if (report?.created_at && report?.due_at) {
        const due = new Date(report.due_at).getTime();
        const created = new Date(report.created_at).getTime();
        if (Number.isFinite(due) && Number.isFinite(created)) {
            return Math.round((due - created) / 86400000);
        }
    }
    return null;
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
