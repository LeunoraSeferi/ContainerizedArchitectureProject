"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { count } = useCart();
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-bold text-lg">
          ShopSphere
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/products" className="hover:underline focus-visible:ring px-2 py-1 rounded">
            Products
          </Link>

          <Link href="/cart" className="relative hover:underline focus-visible:ring px-2 py-1 rounded">
            Cart
            <span className="ml-2 inline-flex items-center justify-center rounded-full border px-2 text-sm">
              {count}
            </span>
          </Link>

          {!user ? (
            <>
              <Link href="/login" className="hover:underline focus-visible:ring px-2 py-1 rounded">
                Login
              </Link>
              <Link href="/register" className="hover:underline focus-visible:ring px-2 py-1 rounded">
                Register
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/orders" className="hover:underline focus-visible:ring px-2 py-1 rounded">
                My Orders
              </Link>

              {isAdmin && (
                <Link href="/admin" className="hover:underline focus-visible:ring px-2 py-1 rounded">
                  Admin
                </Link>
              )}

              <button
                onClick={logout}
                className="border rounded px-3 py-1 focus-visible:ring"
                aria-label="Logout"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
