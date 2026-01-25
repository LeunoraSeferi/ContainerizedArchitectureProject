import Image from "next/image";
import { apiGetProduct } from "@/lib/api";
import { getProductImage } from "@/lib/images";
import AddToCart from "./AddToCart";

export default async function ProductDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);

  if (Number.isNaN(productId) || productId <= 0) {
    return <div className="py-6">Invalid product id.</div>;
  }

  let product: any;
  try {
    product = await apiGetProduct(productId);
  } catch (e: any) {
    return (
      <div className="py-6 text-red-400">
        Failed to fetch product: {e?.message || "Unknown error"}
      </div>
    );
  }

  const description = String(product?.description ?? "").trim();

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Image
        src={getProductImage(Number(product?.id))}
        alt={String(product?.name || "Product image")}
        width={500}
        height={500}
        className="rounded object-cover"
        priority
      />

      <div>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="text-gray-600">{product.brand}</p>

        <p className="text-xl font-semibold mt-2">
          ${Number(product.price).toFixed(2)}
        </p>

        <div className="mt-2 text-sm">
          {product.inStock ? (
            <span className="text-green-400">In stock</span>
          ) : (
            <span className="text-red-400">Out of stock</span>
          )}
        </div>

        {/*  DESCRIPTION */}
        <div className="mt-4">
          <h2 className="text-sm font-semibold text-gray-200 mb-1">Description</h2>
          {description ? (
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
              {description}
            </p>
          ) : (
            <p className="text-gray-500 text-sm">No description yet.</p>
          )}
        </div>

        <div className="mt-6">
          <AddToCart product={product} />
        </div>
      </div>
    </div>
  );
}
