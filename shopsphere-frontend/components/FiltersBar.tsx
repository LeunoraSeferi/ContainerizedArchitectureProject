"use client";

type Category = { id: number; name: string };

export type Filters = {
  q: string;
  category: string;
  inStock: string; // "", "true", "false"
  minPrice: string;
  maxPrice: string;
  sort: string; // "score desc" | "price asc" | "price desc"
};

export default function FiltersBar({
  categories,
  filters,
  setFilters,
  onApply,
  onReset,
}: {
  categories: Category[];
  filters: Filters;
  setFilters: (f: Filters) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  return (
    <section className="rounded-lg border p-4 mb-6">
      <h2 className="font-semibold mb-3">Filters</h2>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="q" className="block text-sm font-medium">
            Search
          </label>
          <input
            id="q"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            className="mt-1 w-full border rounded px-3 py-2 focus-visible:ring"
            placeholder="Perfume, BrandX..."
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium">
            Category
          </label>
          <select
            id="category"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="mt-1 w-full border rounded px-3 py-2 focus-visible:ring"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="inStock" className="block text-sm font-medium">
            Stock
          </label>
          <select
            id="inStock"
            value={filters.inStock}
            onChange={(e) => setFilters({ ...filters, inStock: e.target.value })}
            className="mt-1 w-full border rounded px-3 py-2 focus-visible:ring"
          >
            <option value="">All</option>
            <option value="true">In stock</option>
            <option value="false">Out of stock</option>
          </select>
        </div>

        <div>
          <label htmlFor="minPrice" className="block text-sm font-medium">
            Min price
          </label>
          <input
            id="minPrice"
            type="number"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            className="mt-1 w-full border rounded px-3 py-2 focus-visible:ring"
            placeholder="0"
          />
        </div>

        <div>
          <label htmlFor="maxPrice" className="block text-sm font-medium">
            Max price
          </label>
          <input
            id="maxPrice"
            type="number"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            className="mt-1 w-full border rounded px-3 py-2 focus-visible:ring"
            placeholder="500"
          />
        </div>

        <div>
          <label htmlFor="sort" className="block text-sm font-medium">
            Sort
          </label>
          <select
            id="sort"
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            className="mt-1 w-full border rounded px-3 py-2 focus-visible:ring"
          >
            <option value="score desc">Relevance</option>
            <option value="price asc">Price: Low → High</option>
            <option value="price desc">Price: High → Low</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onApply}
          className="border rounded px-4 py-2 focus-visible:ring"
        >
          Apply
        </button>
        <button
          onClick={onReset}
          className="border rounded px-4 py-2 focus-visible:ring"
        >
          Reset
        </button>
      </div>
    </section>
  );
}
