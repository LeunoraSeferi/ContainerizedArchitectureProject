"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiGetProducts, apiDeleteProduct, apiUpdateProduct } from "@/lib/api";

export default function AdminProductsPage() {
  const { user, token, isAdmin } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  async function load() {
    setMsg(null);
    setLoading(true);
    try {
      const all = await apiGetProducts();
      setProducts(Array.isArray(all) ? all : []);
    } catch (e: any) {
      setMsg(e?.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Guards
  if (!user || !token) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-3">Admin Products</h1>
        <p className="text-red-400">Login as admin first.</p>
        <Link
          className="inline-block mt-3 border rounded px-3 py-2"
          href="/login?next=/admin/products"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-3">Admin Products</h1>
        <p className="text-red-400">Access denied. Admin only.</p>
      </div>
    );
  }

  async function remove(id: number) {
    setMsg(null);
    try {
      const t = token ?? "";
      await apiDeleteProduct(t, id);
      setMsg(" Product deleted");
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Delete failed");
    }
  }

  async function toggleStock(p: any) {
    setMsg(null);
    try {
      const t = token ?? "";
      await apiUpdateProduct(t, Number(p.id), {
        name: p.name,
        brand: p.brand,
        price: Number(p.price),
        inStock: !Boolean(p.inStock),
        categoryId: Number(p.categoryId),
      });
      setMsg(" Stock updated");
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Update failed");
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Products</h1>
        <Link className="border rounded px-3 py-2" href="/admin/products/new">
          + Add Product
        </Link>
      </div>

      {msg && <p className="text-yellow-200 text-sm">{msg}</p>}

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="border rounded p-4 flex items-center justify-between gap-3"
            >
              <div>
                <div className="font-semibold">
                  #{p.id} — {p.name}
                </div>
                <div className="text-sm text-gray-400">
                  Brand: {p.brand} • Price: ${Number(p.price).toFixed(2)} • Stock:{" "}
                  {Boolean(p.inStock) ? "In stock" : "Out of stock"}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className="border rounded px-3 py-2 text-sm"
                  onClick={() => toggleStock(p)}
                >
                  Toggle Stock
                </button>

                <Link
                  className="border rounded px-3 py-2 text-sm"
                  href={`/admin/products/${p.id}`}
                >
                  Edit
                </Link>

                <button
                  className="border rounded px-3 py-2 text-sm text-red-300"
                  onClick={() => remove(Number(p.id))}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <p className="text-gray-400 text-sm">No products yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
