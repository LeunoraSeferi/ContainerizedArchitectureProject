import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-4">
        {/* MANAGE */}
        <Link href="/admin/products" className="border rounded p-4 block hover:opacity-90">
          <div className="font-semibold">Manage Products</div>
          <div className="text-sm text-gray-400">
            List / Edit / Delete / Toggle Stock
          </div>
        </Link>

        <Link href="/admin/categories" className="border rounded p-4 block hover:opacity-90">
          <div className="font-semibold">Manage Categories</div>
          <div className="text-sm text-gray-400">
            List / Edit / Delete
          </div>
        </Link>

        <Link href="/admin/orders" className="border rounded p-4 block hover:opacity-90">
          <div className="font-semibold">Manage Orders</div>
          <div className="text-sm text-gray-400">
            View all orders and update status
          </div>
        </Link>

        {/* ADD NEW */}
        <Link href="/admin/products/new" className="border rounded p-4 block hover:opacity-90">
          <div className="font-semibold">Add Product</div>
          <div className="text-sm text-gray-400">Create new products</div>
        </Link>

        <Link href="/admin/categories/new" className="border rounded p-4 block hover:opacity-90">
          <div className="font-semibold">Add Category</div>
          <div className="text-sm text-gray-400">Create new categories</div>
        </Link>
      </div>
    </div>
  );
}
