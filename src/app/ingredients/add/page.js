"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft } from "lucide-react";

const UNITS = ["kg", "g", "l", "ml", "pcs"];

export default function AddIngredient() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [startingStock, setStartingStock] = useState("");
  const [minimumStock, setMinimumStock] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { error: insertError } = await supabase.from("ingredients").insert([
      {
        name,
        unit,
        starting_stock: Number(startingStock),
        minimum_stock: Number(minimumStock),
      },
    ]);

    setSaving(false);

    if (insertError) {
      setError(insertError.message || "Something went wrong adding this ingredient.");
    } else {
      router.push("/ingredients");
    }
  }

  return (
    <main className="p-8 text-[var(--text)]">
      <Link
        href="/ingredients"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)]"
      >
        <ArrowLeft size={16} />
        Back to ingredients
      </Link>

      <div className="max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h1 className="mb-6 text-xl font-bold">Add Ingredient</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Ingredient Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Example: Wheat Flour"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Starting Stock</label>
            <input
              type="number"
              min="0"
              step="any"
              value={startingStock}
              onChange={(e) => setStartingStock(e.target.value)}
              placeholder="Example: 50"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Minimum Stock Level</label>
            <input
              type="number"
              min="0"
              step="any"
              value={minimumStock}
              onChange={(e) => setMinimumStock(e.target.value)}
              placeholder="Example: 5"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              required
            />
            <p className="mt-1.5 text-xs text-[var(--muted)]">
              You'll get a low-stock warning once this ingredient drops to or below this amount —
              useful for catching a shortage before it delays production.
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
            {saving ? "Saving..." : "Save Ingredient"}
          </button>
        </form>
      </div>
    </main>
  );
}