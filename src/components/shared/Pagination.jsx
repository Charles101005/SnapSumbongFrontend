// Windowed page-number pagination: always shows first, last, and the
// current page ±2 with "…" gaps, so the button row stays a constant size
// no matter how many pages exist. Seven or fewer pages render in full
// with no ellipsis.

function getPageItems(currentPage, totalPages) {
    const last = Math.max(1, totalPages || 1);
    const current = Math.min(Math.max(1, currentPage || 1), last);

    if (last <= 7) {
        return Array.from({ length: last }, (_, i) => i + 1);
    }

    const pages = new Set([1, last]);
    for (let page = current - 2; page <= current + 2; page += 1) {
        if (page >= 1 && page <= last) pages.add(page);
    }

    const items = [];
    let previous = 0;
    for (const page of [...pages].sort((a, b) => a - b)) {
        if (page - previous > 1) items.push("ellipsis");
        items.push(page);
        previous = page;
    }
    return items;
}

export default function Pagination({ currentPage, totalPages, loading = false, onPageChange, children }) {
    const last = Math.max(1, totalPages || 1);
    const safePage = Math.min(Math.max(1, currentPage || 1), last);
    const items = getPageItems(safePage, last);

    return (
        <div className="pagination">
            <span className="pagination-info">{children}</span>
            <div className="pagination-buttons">
                <button
                    className="pagination-btn"
                    disabled={loading || safePage <= 1}
                    onClick={() => onPageChange(safePage - 1)}
                >
                    Previous
                </button>
                {items.map((item, index) =>
                    item === "ellipsis" ? (
                        <span key={`ellipsis-${index}`} className="pagination-ellipsis" aria-hidden="true">
                            …
                        </span>
                    ) : (
                        <button
                            key={item}
                            className={`pagination-btn ${item === safePage ? "active" : ""}`}
                            aria-current={item === safePage ? "page" : undefined}
                            disabled={loading}
                            onClick={() => onPageChange(item)}
                        >
                            {item}
                        </button>
                    )
                )}
                <button
                    className="pagination-btn"
                    disabled={loading || safePage >= last}
                    onClick={() => onPageChange(safePage + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
