"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";

export default function AddProduct() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [minimumStock, setMinimumStock] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { error: insertError } = await supabase.from("products").insert([
      {
        name: name,
        quantity: Number(quantity),
        minimum_stock: Number(minimumStock),
      },
    ]);

    setSaving(false);

    if (insertError) {
      console.log(insertError);
      setError(insertError.message || "Something went wrong adding this product.");
    } else {
      router.push("/products");
    }
  }

  return (
    <main className="p-8 text-[var(--text)]">
      <Link
        href="/products"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft size={16} />
        Back to products
      </Link>

      <div className="max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h1 className="mb-6 text-xl font-bold">Add Product</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Product Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Example: Chocolate Cookies"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Starting Quantity</label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Example: 100"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Minimum Stock Level</label>
            <input
              type="number"
              min="0"
              value={minimumStock}
              onChange={(e) => setMinimumStock(e.target.value)}
              placeholder="Example: 20"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              required
            />
            <p className="mt-1.5 text-xs text-[var(--muted)]">
              You'll get a low-stock alert once you drop to or below this number.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Product"}
          </button>
        </form>
      </div>
    </main>
  );
}