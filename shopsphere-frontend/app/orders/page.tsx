"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiGetOrders } from "@/lib/api";
import Link from "next/link";

type OrderItem = { productId: number; qty: number; unitPrice: number };
type Order = {
  id: number;
  customerId: number;
  status: string;
  items: OrderItem[];
  createdAt?: string;
};

export default function OrdersPage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (!user || !token) return;

        const all = await apiGetOrders(token);
        const mine = all.filter((o: Order) => Number(o.customerId) === Number(user.id));
        setOrders(mine);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, token]);

  if (!user || !token) {
    return (
      <div className="max-w-4xl mx-auto">
        <p role="alert" className="text-red-400">
          Please login to view orders.
        </p>
        <Link className="inline-block mt-3 border rounded px-3 py-2 focus-visible:ring" href="/login?next=/orders">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>

      {loading && <p>Loading...</p>}

      {!loading && orders.length === 0 && (
        <div className="border rounded p-4">
          <p className="text-gray-500">No orders yet.</p>
          <Link className="inline-block mt-3 border rounded px-3 py-2 focus-visible:ring" href="/products">
            Go shopping
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="border rounded p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Order #{o.id}</div>
              <span className="text-xs border rounded px-2 py-1">{o.status}</span>
            </div>

            <div className="mt-3 text-sm space-y-1">
              {o.items?.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span>Product {it.productId} × {it.qty}</span>
                  <span>${(it.qty * it.unitPrice).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
