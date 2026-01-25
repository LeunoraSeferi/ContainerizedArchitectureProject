"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { apiCreateCategory } from "@/lib/api";
import { getCategoryImage } from "@/lib/images";

export default function AdminNewCategoryPage() {
  const router = useRouter();
  const { user, token, isAdmin } = useAuth();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // 🔒 admin guard
  if (!user || !token || !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Add Category</h1>
        <p role="alert" className="text-red-400">
          Access denied. Admins only.
        </p>
      </div>
    );
  }

  const authToken = token;
  const previewSrc = getCategoryImage(name);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!name.trim()) return setMsg("Category name is required.");

    try {
      setLoading(true);
      await apiCreateCategory(authToken, { name: name.trim() });

      router.push("/products");
      router.refresh();
    } catch (err: any) {
      setMsg(err?.message || "Failed to create category.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Add Category</h1>

      <form onSubmit={onSubmit} className="border rounded p-4 space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Category name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Perfumes, Cosmetics..."
            className="w-full rounded border px-3 py-2 focus-visible:ring bg-transparent"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Image preview</p>
          <div className="border rounded p-3 inline-block">
            <Image
              src={previewSrc}
              alt="Category preview"
              width={220}
              height={220}
              className="rounded object-cover"
            />
          </div>
        </div>

        {msg && (
          <p role="alert" className="text-red-400">
            {msg}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white rounded px-4 py-2 focus-visible:ring disabled:opacity-50"
        >
          {loading ? "Saving..." : "Create Category"}
        </button>
      </form>
    </div>
  );
}
