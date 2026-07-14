"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Factory, History } from "lucide-react";

export default function Production() {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [productionHistory, setProductionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function fetchProducts() {
    const { data, error } = await supabase.from("products").select("*");

    if (error) {
      console.log(error);
    } else {
      setProducts(data || []);
    }
  }

  async function fetchProductionHistory() {
    setLoading(true);

    const { data, error } = await supabase
      .from("production")
      .select(`id, quantity, created_at, products(name)`)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.log(error);
    } else {
      setProductionHistory(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();
    fetchProductionHistory();
  }, []);

  async function addProduction(e) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from("production").insert([
      {
        product_id: productId,
        quantity: Number(quantity),
      },
    ]);

    setSaving(false);

    if (error) {
      console.log(error);
      alert("Error adding production: " + error.message);
    } else {
      setProductId("");
      setQuantity("");
      fetchProductionHistory();
    }
  }

  return (
    <main className="p-8 text-[var(--text)]">
      <h1 className="mb-6 text-2xl font-bold">Production</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-fit rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 text-sm font-semibold text-[var(--muted)]">Log Production</h2>

          <form onSubmit={addProduction} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Select Product</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
                required
              >
                <option value="">Choose product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Quantity Produced</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
                required
              />
            </div>

            <button
              disabled={saving}
              className="w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add Production"}
            </button>
          </form>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--muted)]">Recent Production</h2>
            <Link
              href="/production/history"
              className="flex items-center gap-1.5 text-sm text-[var(--primary)] hover:underline"
            >
              <History size={14} />
              View full history
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-[var(--border)]">
            {loading ? (
              <div className="p-10 text-center text-sm text-[var(--muted)]">
                Loading...
              </div>
            ) : productionHistory.length === 0 ? (
              <div className="flex flex-col items-center gap-3 p-10 text-center">
                <Factory size={28} className="text-[var(--muted)]" />
                <p className="text-sm text-[var(--muted)]">No production logged yet.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--card)] text-left">
                    <th className="p-3 font-medium text-[var(--muted)]">Product</th>
                    <th className="p-3 font-medium text-[var(--muted)]">Quantity</th>
                    <th className="p-3 font-medium text-[var(--muted)]">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {productionHistory.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--card)]"
                    >
                      <td className="p-3">{item.products?.name || "Unknown"}</td>
                      <td className="p-3 text-green-400">+{item.quantity}</td>
                      <td className="p-3 text-[var(--muted)]">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}