"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { apiCreateProduct, apiGetCategories } from "@/lib/api";
import { getProductImage } from "@/lib/images";

type Category = { id: number; name: string };

export default function AdminNewProductPage() {
  const router = useRouter();
  const { user, token, isAdmin } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [inStock, setInStock] = useState(true);
  const [categoryId, setCategoryId] = useState<number | "">("");

  // description field
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  //  admin guard
  if (!user || !token || !isAdmin) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Add Product</h1>
        <p role="alert" className="text-red-400">
          Access denied. Admins only.
        </p>
      </div>
    );
  }

  const authToken = token;

  useEffect(() => {
    (async () => {
      try {
        setLoadingCats(true);
        const data = await apiGetCategories();
        setCategories(Array.isArray(data) ? data : []);
      } catch {
        setCategories([]);
      } finally {
        setLoadingCats(false);
      }
    })();
  }, []);

  const previewSrc = useMemo(() => getProductImage(name), [name]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!name.trim()) return setMsg("Product name is required.");
    if (!brand.trim()) return setMsg("Brand is required.");
    if (!price || price <= 0) return setMsg("Price must be > 0.");
    if (categoryId === "") return setMsg("Please choose a category.");

    // description validation
    if (!description.trim()) return setMsg("Description is required.");

    try {
      setSaving(true);

      await apiCreateProduct(authToken, {
        name: name.trim(),
        brand: brand.trim(),
        price: Number(price),
        inStock,
        categoryId: Number(categoryId),

        // description field
        description: description.trim(),
      });

      router.push("/products");
      router.refresh();
    } catch (err: any) {
      setMsg(err?.message || "Failed to create product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Add Product</h1>

      <form onSubmit={onSubmit} className="border rounded p-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Product name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Perfume A"
              className="w-full rounded border px-3 py-2 focus-visible:ring bg-transparent"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="brand" className="text-sm font-medium">
              Brand
            </label>
            <input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="BrandX"
              className="w-full rounded border px-3 py-2 focus-visible:ring bg-transparent"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="price" className="text-sm font-medium">
              Price
            </label>
            <input
              id="price"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full rounded border px-3 py-2 focus-visible:ring bg-transparent"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="categoryId" className="text-sm font-medium">
              Category
            </label>
            <select
              id="categoryId"
              value={categoryId}
              onChange={(e) =>
                setCategoryId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full rounded border px-3 py-2 focus-visible:ring bg-transparent"
              disabled={loadingCats}
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {loadingCats && (
              <p className="text-xs text-gray-400">Loading categories...</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="inStock"
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="inStock" className="text-sm font-medium">
              In stock
            </label>
          </div>
        </div>

        {/*  Description input */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write a short product description..."
            rows={4}
            className="w-full rounded border px-3 py-2 focus-visible:ring bg-transparent"
          />
          <p className="text-xs text-gray-400">
            This will appear on “View details”.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Image preview</p>
          <div className="border rounded p-3 inline-block">
            <Image
              src={previewSrc}
              alt="Product preview"
              width={420}
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
          disabled={saving}
          className="bg-black text-white rounded px-4 py-2 focus-visible:ring disabled:opacity-50"
        >
          {saving ? "Saving..." : "Create Product"}
        </button>
      </form>
    </div>
  );
}
