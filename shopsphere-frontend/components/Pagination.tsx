"use client";

export default function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    Math.max(0, page - 3),
    Math.max(0, page - 3) + 5
  );

  return (
    <div className="flex items-center gap-2 mt-6">
      <button
        className="border rounded px-3 py-2 text-sm focus-visible:ring"
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        Prev
      </button>

      {pages.map((p) => (
        <button
          key={p}
          className={`border rounded px-3 py-2 text-sm focus-visible:ring ${
            p === page ? "font-bold" : ""
          }`}
          onClick={() => onPage(p)}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </button>
      ))}

      <button
        className="border rounded px-3 py-2 text-sm focus-visible:ring"
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
      >
        Next
      </button>
    </div>
  );
}
