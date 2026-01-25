"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiGetCategories, apiDeleteCategory } from "@/lib/api";

export default function AdminCategoriesPage() {
  const { user, isAdmin, requireToken } = useAuth();
  const [cats, setCats] = useState<Array<{ id: number; name: string }>>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    try {
      const data = await apiGetCategories();
      setCats(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setMsg(e?.message || "Failed to load categories");
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-3">Admin Categories</h1>
        <p className="text-red-400">Login as admin first.</p>
        <Link
          className="inline-block mt-3 border rounded px-3 py-2"
          href="/login?next=/admin/categories"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-3">Admin Categories</h1>
        <p className="text-red-400">Access denied. Admin only.</p>
      </div>
    );
  }

  async function remove(id: number) {
    setMsg(null);
    try {
      const token = requireToken();
      await apiDeleteCategory(token, id);
      setMsg("✅ Category deleted");
      load();
    } catch (e: any) {
      setMsg(e?.message || "Delete failed (maybe category is used by products)");
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Categories</h1>
        <Link className="border rounded px-3 py-2" href="/admin/categories/new">
          + Add Category
        </Link>
      </div>

      {msg && <p className="text-yellow-200 text-sm">{msg}</p>}

      <div className="space-y-3">
        {cats.map((c) => (
          <div
            key={c.id}
            className="border rounded p-4 flex items-center justify-between"
          >
            <div className="font-semibold">
              #{c.id} — {c.name}
            </div>

            <div className="flex gap-2">
              <Link
                className="border rounded px-3 py-2 text-sm"
                href={`/admin/categories/${c.id}`}
              >
                Edit
              </Link>

              <button
                className="border rounded px-3 py-2 text-sm text-red-300"
                onClick={() => remove(c.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {cats.length === 0 && (
          <p className="text-gray-400 text-sm">No categories yet.</p>
        )}
      </div>
    </div>
  );
}
