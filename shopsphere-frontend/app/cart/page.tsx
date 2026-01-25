"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { getProductImage } from "@/lib/images";

export default function CartPage() {
  const { items, remove, setQty, total, clear } = useCart();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Cart</h1>

        {items.length > 0 && (
          <button
            onClick={clear}
            className="rounded border px-3 py-2 text-sm focus-visible:ring"
            aria-label="Clear cart"
          >
            Clear cart
          </button>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="rounded-lg border p-6">
          <p className="text-gray-500">Your cart is empty.</p>
          <Link
            href="/products"
            className="mt-4 inline-block rounded border px-4 py-2 text-sm focus-visible:ring"
          >
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((it) => (
              <div
                key={it.productId}
                className="rounded-lg border p-4 flex gap-4"
              >
                <Image
                  src={getProductImage(it.productId)}
                  alt={it.name}
                  width={160}
                  height={160}
                  className="h-24 w-24 rounded object-cover"
                />

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{it.name}</p>
                      <p className="text-sm text-gray-500">{it.brand || "—"}</p>
                      <p className="mt-1 font-bold">${it.price}</p>
                    </div>

                    <button
                      onClick={() => remove(it.productId)}
                      className="rounded border px-3 py-2 text-sm focus-visible:ring"
                      aria-label={`Remove ${it.name} from cart`}
                    >
                      Remove
                    </button>
                  </div>

                  {/* Qty controls */}
                  <div className="mt-3 flex items-center gap-2">
                    <label
                      htmlFor={`qty-${it.productId}`}
                      className="text-sm font-medium"
                    >
                      Quantity
                    </label>

                    <button
                      onClick={() => setQty(it.productId, it.qty - 1)}
                      className="rounded border px-3 py-1 focus-visible:ring"
                      aria-label={`Decrease quantity of ${it.name}`}
                    >
                      −
                    </button>

                    <input
                      id={`qty-${it.productId}`}
                      type="number"
                      min={1}
                      value={it.qty}
                      onChange={(e) =>
                        setQty(it.productId, Number(e.target.value))
                      }
                      className="w-20 rounded border px-2 py-1 text-center focus-visible:ring"
                    />

                    <button
                      onClick={() => setQty(it.productId, it.qty + 1)}
                      className="rounded border px-3 py-1 focus-visible:ring"
                      aria-label={`Increase quantity of ${it.name}`}
                    >
                      +
                    </button>

                    <p className="ml-auto text-sm text-gray-500">
                      Item total:{" "}
                      <span className="font-semibold text-white">
                        ${(it.qty * it.price).toFixed(2)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <aside className="rounded-lg border p-4 space-y-3 h-fit">
            <h2 className="text-lg font-semibold">Summary</h2>

            <div className="flex items-center justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-semibold">${total.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span>Shipping</span>
              <span className="font-semibold">$0.00</span>
            </div>

            <div className="border-t pt-3 flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold">${total.toFixed(2)}</span>
            </div>

            <div className="flex gap-2">
              <Link
                href="/products"
                className="w-full text-center rounded border px-4 py-2 text-sm focus-visible:ring"
              >
                Continue shopping
              </Link>

              <Link
                href="/checkout"
                className="w-full text-center rounded bg-black text-white px-4 py-2 text-sm focus-visible:ring"
                aria-label="Go to checkout"
              >
                Go to checkout
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
