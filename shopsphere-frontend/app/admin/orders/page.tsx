"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiGetOrders, apiUpdateOrderStatus } from "@/lib/api";

const STATUSES = ["PENDING", "PAID", "SHIPPED", "CANCELLED"];

export default function AdminOrdersPage() {
  const { user, token, isAdmin } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setMsg(null);
    setLoading(true);
    try {
      const t = token!; // token is guaranteed because we block if no token
      const data = await apiGetOrders(t);
      setOrders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setMsg(e?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) load();
  }, [token]);

  if (!user || !token) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-3">Admin Orders</h1>
        <p className="text-red-400">Login as admin first.</p>
        <Link
          className="inline-block mt-3 border rounded px-3 py-2"
          href="/login?next=/admin/orders"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-3">Admin Orders</h1>
        <p className="text-red-400">Access denied. Admin only.</p>
      </div>
    );
  }

  async function changeStatus(orderId: number, status: string) {
    setMsg(null);
    try {
      const t = token!;
      await apiUpdateOrderStatus(t, orderId, status);
      setMsg(` Order #${orderId} updated to ${status}`);
      load();
    } catch (e: any) {
      setMsg(e?.message || "Update failed");
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Orders</h1>
        <Link className="border rounded px-3 py-2" href="/admin">
          ← Back to Admin
        </Link>
      </div>

      {msg && <p className="text-yellow-200 text-sm">{msg}</p>}

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="border rounded p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">
                  Order #{o.id} — Customer {o.customerId ?? o.userId ?? "?"} — Total $
                  {Number(o.total ?? 0).toFixed(2)}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Status:</span>

                  <select
                    className="border rounded px-2 py-1 bg-black"
                    value={o.status}
                    onChange={(e) => changeStatus(Number(o.id), e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-sm text-gray-400">
                Created: {String(o.createdAt ?? o.created_at ?? "")}
              </div>

              <div className="text-sm">
                <div className="font-semibold mb-1">Items:</div>
                {o.items?.length ? (
                  <ul className="list-disc pl-5 text-gray-300">
                    {o.items.map((it: any, idx: number) => (
                      <li key={idx}>
                        productId={it.productId ?? it.product_id} • qty={it.qty ?? it.quantity} •
                        unitPrice=${Number(it.unitPrice ?? it.unit_price ?? 0).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No items</p>
                )}
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <p className="text-gray-400 text-sm">No orders yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
