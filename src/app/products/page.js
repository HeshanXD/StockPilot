"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCurrentStock } from "@/lib/stock";
import { Package, Plus, Trash2 } from "lucide-react";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [stockByProduct, setStockByProduct] = useState({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  async function fetchProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setProducts(data || []);

    const stockMap = {};
    for (const product of data || []) {
      stockMap[product.id] = await getCurrentStock(product);
    }
    setStockByProduct(stockMap);

    setLoading(false);
  }

  async function deleteProduct(id, name) {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;

    setDeletingId(id);

    const { error } = await supabase.from("products").delete().eq("id", id);

    setDeletingId(null);

    if (error) {
      console.log(error);
      alert("Error deleting product: " + error.message);
    } else {
      fetchProducts();
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <main className="p-8 text-[var(--text)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Everything you manufacture, with live stock levels.
          </p>
        </div>

        <Link
          href="/products/add"
          className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border)]">
        {loading ? (
          <div className="p-10 text-center text-sm text-[var(--muted)]">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <Package size={32} className="text-[var(--muted)]" />
            <p className="text-sm text-[var(--muted)]">No products added yet.</p>
            <Link
              href="/products/add"
              className="mt-1 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Add your first product
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--card)] text-left">
                <th className="p-3 font-medium text-[var(--muted)]">Product</th>
                <th className="p-3 font-medium text-[var(--muted)]">Current Stock</th>
                <th className="p-3 font-medium text-[var(--muted)]">Minimum</th>
                <th className="p-3 font-medium text-[var(--muted)]">Status</th>
                <th className="p-3 font-medium text-[var(--muted)]"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const stock = stockByProduct[product.id] ?? product.quantity;
                const isLow = product.minimum_stock && stock <= product.minimum_stock;

                return (
                  <tr
                    key={product.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--card)]"
                  >
                    <td className="p-3 font-medium">{product.name}</td>
                    <td className="p-3">{stock}</td>
                    <td className="p-3 text-[var(--muted)]">
                      {product.minimum_stock ?? "—"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          isLow
                            ? "bg-red-500/10 text-red-400"
                            : "bg-green-500/10 text-green-400"
                        }`}
                      >
                        {isLow ? "Low stock" : "Healthy"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => deleteProduct(product.id, product.name)}
                        disabled={deletingId === product.id}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        {deletingId === product.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}