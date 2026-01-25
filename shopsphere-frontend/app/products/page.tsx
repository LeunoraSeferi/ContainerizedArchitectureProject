"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGetCategories, apiGetProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import FiltersBar, { Filters } from "@/components/FiltersBar";

type Category = { id: number; name: string };

function norm(v: any) {
  return String(v ?? "").trim().toLowerCase();
}

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  // UI inputs
  const [filters, setFilters] = useState<Filters>({
    q: "",
    category: "",
    inStock: "",
    minPrice: "",
    maxPrice: "",
    sort: "score desc", // match FiltersBar default
  });

  // Applied filters (when you click Apply)
  const [applied, setApplied] = useState<Filters>({
    q: "",
    category: "",
    inStock: "",
    minPrice: "",
    maxPrice: "",
    sort: "score desc",
  });

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Load categories
  useEffect(() => {
    (async () => {
      try {
        const cats = await apiGetCategories();
        setCategories(Array.isArray(cats) ? cats : []);
      } catch {
        setCategories([]);
      }
    })();
  }, []);

  // Load products once
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const all = await apiGetProducts();
        setProducts(Array.isArray(all) ? all : []);
      } catch (e: any) {
        setProducts([]);
        setErr(e?.message || "Failed to load products.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function applyFilters() {
    setApplied({ ...filters });
  }

  function resetFilters() {
    const clean: Filters = {
      q: "",
      category: "",
      inStock: "",
      minPrice: "",
      maxPrice: "",
      sort: "score desc",
    };
    setFilters(clean);
    setApplied(clean);
  }

  const visibleProducts = useMemo(() => {
    let list = [...products];

    const q = norm(applied.q);

    const categoryId =
      applied.category !== "" && !Number.isNaN(Number(applied.category))
        ? Number(applied.category)
        : null;

    const stock = applied.inStock;

    const minP =
      applied.minPrice !== "" && !Number.isNaN(Number(applied.minPrice))
        ? Number(applied.minPrice)
        : null;

    const maxP =
      applied.maxPrice !== "" && !Number.isNaN(Number(applied.maxPrice))
        ? Number(applied.maxPrice)
        : null;

    // Search (name OR brand)
    if (q) {
      list = list.filter((p) => {
        const name = norm(p?.name);
        const brand = norm(p?.brand);
        return name.includes(q) || brand.includes(q);
      });
    }

    // Category
    if (categoryId !== null) {
      list = list.filter((p) => Number(p?.categoryId) === categoryId);
    }

    // Stock
    if (stock === "true") list = list.filter((p) => Boolean(p?.inStock) === true);
    if (stock === "false") list = list.filter((p) => Boolean(p?.inStock) === false);

    // Price range
    if (minP !== null) list = list.filter((p) => Number(p?.price) >= minP);
    if (maxP !== null) list = list.filter((p) => Number(p?.price) <= maxP);

    //  Sort 
    switch (applied.sort) {
      case "price asc":
        list.sort((a, b) => Number(a?.price) - Number(b?.price));
        break;
      case "price desc":
        list.sort((a, b) => Number(b?.price) - Number(a?.price));
        break;
      case "score desc":
      default:
        // relevance = keep order
        break;
    }

    return list;
  }, [products, applied]);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold mb-4">Products</h1>

      <FiltersBar
        categories={categories}
        filters={filters}
        setFilters={setFilters}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {err && (
        <div role="alert" className="border rounded p-3 mb-4">
          {err}
        </div>
      )}

      {loading && <div className="py-6">Loading products…</div>}

      {!loading && !err && visibleProducts.length === 0 && (
        <div className="py-6">No products match your filters.</div>
      )}

      {!loading && !err && visibleProducts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((p: any) => (
            <ProductCard
              key={p.id}
              product={{
                id: p.id,
                name: p.name,
                brand: p.brand,
                price: Number(p.price),
                inStock: Boolean(p.inStock),
                categoryId: p.categoryId,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
