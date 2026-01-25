// lib/images.ts

// ---------- PRODUCTS ----------
export function getProductImage(value: unknown) {
  const key = String(value ?? "")
    .trim()
    .toLowerCase();

  const map: Record<string, string> = {
    //  by ID
    "1": "/images/products/parfum-a.jpg",
    "2": "/images/products/parfum-b.jpg",
    "3": "/images/products/default-product.jpg",
    "4": "/images/products/sol.jpg",

    //  by NAME (must be lowercase because we use .toLowerCase())
    "perfume a": "/images/products/parfum-a.jpg",
    "perfume b": "/images/products/parfum-b.jpg",
    "sol de janeiro": "/images/products/sol.jpg",
    "cheirosa 91 perfume mist": "/images/products/sol.jpg",
  };

  return map[key] ?? "/images/products/default-product.jpg";
}

// ---------- CATEGORIES ----------
export function getCategoryImage(value: unknown) {
  const key = String(value ?? "")
    .trim()
    .toLowerCase();

  const map: Record<string, string> = {
    //  by ID
    "1": "/images/categories/perfume.avif",
    "2": "/images/categories/cosmetic.jpg",
    "3": "/images/categories/acc.jpg",

    //  by NAME
    "perfumes": "/images/categories/perfume.avif",
    "cosmetics": "/images/categories/cosmetic.jpg",
    "accessories": "/images/categories/acc.jpg",
    "shoes": "/images/categories/default-category.jpg", 
  };

  return map[key] ?? "/images/categories/default-category.jpg";
}