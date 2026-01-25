"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiGetCategories, apiGetProduct, apiUpdateProduct } from "@/lib/api";

type Category = { id: number; name: string };

export default function AdminEditProductPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  const { user, token, isAdmin } = useAuth();

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<number>(1);
  const [inStock, setInStock] = useState<boolean>(true);

  // DESCRIPTION FIELD
  const [description, setDescription] = useState("");

  async function load() {
    setMsg(null);
    setLoading(true);

    try {
      const [p, cats] = await Promise.all([apiGetProduct(id), apiGetCategories()]);

      setCategories(Array.isArray(cats) ? cats : []);

      setName(String(p?.name ?? ""));
      setBrand(String(p?.brand ?? ""));
      setPrice(Number(p?.price ?? 0));
      setCategoryId(Number(p?.categoryId ?? 1));
      setInStock(Boolean(p?.inStock));

      //DESCRIPTION
      setDescription(String(p?.description ?? ""));
    } catch (e: any) {
      setMsg(e?.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isNaN(id) && id > 0) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Guards
  if (!user || !token) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-3">Edit Product</h1>
        <p className="text-red-400">Login as admin first.</p>
        <Link
          className="inline-block mt-3 border rounded px-3 py-2"
          href={`/login?next=/admin/products/${id}`}
        >
          Go to Login
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-3">Edit Product</h1>
        <p className="text-red-400">Access denied. Admin only.</p>
      </div>
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    try {
      const t = token ?? "";

      await apiUpdateProduct(t, id, {
        name: String(name).trim(),
        brand: String(brand).trim(),
        price: Number(price),
        inStock: Boolean(inStock),
        categoryId: Number(categoryId),

        // DESCRIPTION FIELD
        description: String(description).trim(),
      });

      setMsg("Product updated successfully");
    } catch (e: any) {
      setMsg(e?.message || "Update failed");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Product #{id}</h1>
        <Link className="border rounded px-3 py-2" href="/admin/products">
          ← Back
        </Link>
      </div>

      {msg && <p className="text-yellow-200 text-sm">{msg}</p>}

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <form onSubmit={save} className="space-y-4 border rounded p-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Name</label>
            <input
              className="w-full border rounded px-3 py-2 bg-black"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Brand</label>
            <input
              className="w-full border rounded px-3 py-2 bg-black"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Price</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="w-full border rounded px-3 py-2 bg-black"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Category</label>
            <select
              className="w-full border rounded px-3 py-2 bg-black"
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.id} — {c.name}
                </option>
              ))}
            </select>

            {categories.length === 0 && (
              <p className="text-xs text-red-300 mt-2">
                No categories found. Create a category first.
              </p>
            )}
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
            />
            <span className="text-sm text-gray-200">In Stock</span>
          </label>

          {/*  DESCRIPTION */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Description</label>
            <textarea
              className="w-full border rounded px-3 py-2 bg-black min-h-[120px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a short product description..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be shown on the “View details” page.
            </p>
          </div>

          <button className="border rounded px-3 py-2" type="submit">
            Save Changes
          </button>
        </form>
      )}
    </div>
  );
}
