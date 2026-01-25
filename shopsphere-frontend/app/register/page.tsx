"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRegister } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "admin">("customer");

  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      await apiRegister({
        name: name.trim(),
        email: email.trim(),
        password,
        role, // must be "customer" or "admin" (lowercase)
      });

      setMsg("Account created! You can login now.");
      // optional redirect after success
      setTimeout(() => router.push("/login"), 800);
    } catch (err: any) {
      setMsg(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Register</h1>

      {msg && <p className="text-yellow-200 text-sm">{msg}</p>}

      <form onSubmit={onSubmit} className="border rounded p-4 space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Name</label>
          <input
            className="w-full border rounded px-3 py-2 bg-black"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Email</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2 bg-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2 bg-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={4}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Role</label>
          <select
            className="w-full border rounded px-3 py-2 bg-black"
            value={role}
            onChange={(e) => setRole(e.target.value as "customer" | "admin")}
          >
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>

          <p className="text-xs text-gray-500 mt-1">
            (For demo only. In real apps, admin is usually created by the system.)
          </p>
        </div>

        <button
          className="border rounded px-4 py-2 disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="text-sm text-gray-400">
          Already have an account?{" "}
          <Link className="underline" href="/login">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
