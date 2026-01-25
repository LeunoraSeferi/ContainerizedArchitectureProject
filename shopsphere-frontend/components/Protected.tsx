"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Protected({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { token, user, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // not logged in -> go login with next
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    // admin page but user is not admin
    if (adminOnly && !isAdmin) {
      router.replace("/");
    }
  }, [token, adminOnly, isAdmin, pathname, router]);

  // While redirecting, show simple loading
  if (!token) {
    return (
      <div className="rounded-lg border p-6">
        <p className="text-gray-500">Redirecting to login…</p>
      </div>
    );
  }

  // If adminOnly and not admin, we already redirect, but avoid flash
  if (adminOnly && user && !isAdmin) return null;

  return <>{children}</>;
}
