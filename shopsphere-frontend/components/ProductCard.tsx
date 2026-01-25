"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { getProductImage } from "@/lib/images";

type Product = {
  id: string | number;
  name: string;
  brand?: string;
  price: number;
  inStock: boolean;
  categoryId?: number;
};

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();

  const productId = Number(product.id);
  const outOfStock = !product.inStock;

  function handleAdd() {
    if (outOfStock) return; 
    add(
      {
        productId,
        name: product.name,
        brand: product.brand || "—",
        price: product.price,
      },
      1
    );
  }

  return (
    <div className="rounded-lg border p-4 flex flex-col gap-3">
      <Image
        src={getProductImage(productId)}
        alt={product.name}
        width={500}
        height={200}
        className="rounded-lg object-cover w-full h-48"
      />

      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{product.name}</h3>
          <p className="text-sm text-gray-500">{product.brand || "—"}</p>
        </div>

        <span
          className={`text-xs px-2 py-1 rounded border ${
            product.inStock ? "text-green-600" : "text-red-600"
          }`}
        >
          {product.inStock ? "In stock" : "Out of stock"}
        </span>
      </div>

      <div className="text-lg font-bold">${product.price}</div>

      <div className="mt-auto flex gap-2">
        <Link
          href={`/products/${product.id}`}
          className="border rounded px-3 py-2 text-sm focus-visible:ring"
        >
          View details
        </Link>

        <button
          onClick={handleAdd}
          className="bg-black text-white rounded px-3 py-2 text-sm focus-visible:ring disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={`Add ${product.name} to cart`}
          disabled={outOfStock} 
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
