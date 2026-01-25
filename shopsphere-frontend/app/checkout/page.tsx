"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { apiCreateOrder } from "@/lib/api";
import { useState } from "react";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { items, total, clear } = useCart();

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>
        <div className="border rounded p-4">
          <p className="text-gray-500">Your cart is empty.</p>
          <Link className="inline-block mt-3 border rounded px-3 py-2" href="/products">
            Go to products
          </Link>
        </div>
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>
        <div className="border rounded p-4">
          <p className="text-red-400">You must login to checkout.</p>
          <Link className="inline-block mt-3 border rounded px-3 py-2" href="/login?next=/checkout">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  async function placeOrder() {
    setLoading(true);
    setMsg(null);

    const safeUser = user;
    const safeToken = token;

    if (!safeUser?.id || !safeToken) {
      setMsg("Session missing. Please login again.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        customerId: Number(safeUser.id),
        status: "PENDING",
        items: items.map((x) => ({
          productId: Number(x.productId),
          qty: Number(x.qty),
          unitPrice: Number(x.price),
        })),
      };

      await apiCreateOrder(safeToken, payload);

      clear();
      router.push("/orders"); // or /my-orders if you have that page
      router.refresh();
    } catch (e: any) {
      setMsg(e?.message || "Failed to place order.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>

      <div className="border rounded p-4 space-y-3">
        <p className="text-green-400">You are logged in, so you can checkout ✅</p>

        <div className="border-t pt-3 space-y-2">
          {items.map((x) => (
            <div key={x.productId} className="flex justify-between text-sm">
              <div>
                {x.name} × {x.qty}
              </div>
              <div>${(x.price * x.qty).toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div className="border-t pt-3 flex justify-between font-semibold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>

        {msg && <p className="text-red-400">{msg}</p>}

        <button
          onClick={placeOrder}
          disabled={loading}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Placing..." : "Place order"}
        </button>
      </div>
    </div>
  );
}
