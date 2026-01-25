"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiGetCategories, apiUpdateCategory } from "@/lib/api";

type Category = { id: number; name: string };

export default function AdminEditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAdmin, requireToken } = useAuth();

  // params.id can be string | string[]
  const id = useMemo(() => {
    const raw = (params as any)?.id as string | string[] | undefined;
    const val = Array.isArray(raw) ? raw[0] : raw;
    return Number(val);
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [currentName, setCurrentName] = useState("");
  const [newName, setNewName] = useState("");

  useEffect(() => {
    async function load() {
      setMsg(null);
      setLoading(true);

      try {
        if (Number.isNaN(id)) {
          setMsg("Invalid category id in URL.");
          return;
        }

        const cats = await apiGetCategories();
        const list: Category[] = Array.isArray(cats) ? cats : [];
        const found = list.find((c) => Number(c.id) === id);

        if (!found) {
          setMsg("Category not found.");
          return;
        }

        setCurrentName(found.name);
        setNewName(found.name);
      } catch (e: any) {
        setMsg(e?.message || "Failed to load category.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  // Guards
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-3">Edit Category</h1>
        <p className="text-red-400">Login as admin first.</p>
        <Link
          className="inline-block mt-3 border rounded px-3 py-2"
          href={`/login?next=/admin/categories/${Number.isNaN(id) ? "" : id}`}
        >
          Go to Login
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-3">Edit Category</h1>
        <p className="text-red-400">Access denied. Admin only.</p>
      </div>
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    try {
      if (Number.isNaN(id)) throw new Error("Invalid category id.");

      const name = newName.trim();
      if (name.length < 2) {
        throw new Error("Category name must be at least 2 characters.");
      }

      // ✅ this solves the token error (string guaranteed)
      const token = requireToken();

      await apiUpdateCategory(token, id, { name });

      setCurrentName(name);
      setMsg("✅ Category updated successfully");

      // optional:
      // router.push("/admin/categories");
    } catch (e: any) {
      setMsg(e?.message || "Update failed");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Edit Category #{Number.isNaN(id) ? "?" : id}
        </h1>
        <Link className="border rounded px-3 py-2" href="/admin/categories">
          ← Back
        </Link>
      </div>

      {msg && <p className="text-yellow-200 text-sm">{msg}</p>}

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <>
          {/* Current name (what you clicked) */}
          <div className="border rounded p-4">
            <p className="text-sm text-gray-400">Current category name:</p>
            <p className="text-lg font-semibold">{currentName || "—"}</p>
          </div>

          {/* Edit section */}
          <form onSubmit={save} className="space-y-4 border rounded p-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                New name
              </label>
              <input
                className="w-full border rounded px-3 py-2 bg-black"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                minLength={2}
              />
            </div>

            <button className="border rounded px-3 py-2" type="submit">
              Save Changes
            </button>
          </form>
        </>
      )}
    </div>
  );
}