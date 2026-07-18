"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { checkIngredientsForProduction } from "@/lib/ingredients";
import { Factory, History, AlertTriangle } from "lucide-react";

export default function Production() {
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [productionHistory, setProductionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [ingredientPreview, setIngredientPreview] = useState([]);
  const [checkingIngredients, setCheckingIngredients] = useState(false);

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

  // Whenever the chosen product or quantity changes, re-check the recipe
  // so the person sees ingredient impact before they even hit submit.
  useEffect(() => {
    async function runCheck() {
      if (!productId || !quantity || Number(quantity) <= 0) {
        setIngredientPreview([]);
        return;
      }

      setCheckingIngredients(true);
      const result = await checkIngredientsForProduction(productId, Number(quantity));
      setIngredientPreview(result);
      setCheckingIngredients(false);
    }

    runCheck();
  }, [productId, quantity]);

  const hasShortage = ingredientPreview.some((line) => line.short);

  async function addProduction(e) {
    e.preventDefault();

    if (hasShortage) {
      const shortList = ingredientPreview
        .filter((line) => line.short)
        .map((line) => line.name)
        .join(", ");

      if (
        !confirm(
          `You don't have enough of: ${shortList}. Log this production anyway?`
        )
      ) {
        return;
      }
    }

    setSaving(true);

    const { data: productionRow, error } = await supabase
      .from("production")
      .insert([
        {
          product_id: productId,
          quantity: Number(quantity),
        },
      ])
      .select()
      .single();

    if (error) {
      setSaving(false);
      console.log(error);
      alert("Error adding production: " + error.message);
      return;
    }

    // Automatically deduct the recipe's ingredients for this batch.
    if (ingredientPreview.length > 0) {
      const usageRows = ingredientPreview.map((line) => ({
        ingredient_id: line.ingredientId,
        product_id: productId,
        quantity: line.required,
      }));

      const { error: usageError } = await supabase
        .from("ingredient_usage")
        .insert(usageRows);

      if (usageError) {
        console.log(usageError);
        alert(
          "Production was logged, but ingredient stock couldn't be updated: " +
            usageError.message
        );
      }
    }

    setSaving(false);
    setProductId("");
    setQuantity("");
    setIngredientPreview([]);
    fetchProductionHistory();
  }

  return (
    <main className="p-8 text-[var(--text)]">
      <h1 className="mb-6 text-2xl font-bold">Production</h1>

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-fit min-w-0 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
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

            {/* Live ingredient impact preview */}
            {checkingIngredients ? (
              <p className="text-xs text-[var(--muted)]">Checking ingredient stock...</p>
            ) : ingredientPreview.length > 0 ? (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-3">
                <p className="mb-2 text-xs font-medium text-[var(--muted)]">
                  This will use:
                </p>
                <div className="space-y-1.5">
                  {ingredientPreview.map((line) => (
                    <div
                      key={line.ingredientId}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className={line.short ? "text-amber-400" : ""}>
                        {line.name}
                      </span>
                      <span className={line.short ? "text-amber-400" : "text-[var(--muted)]"}>
                        {line.required} {line.unit} needed · {line.available} {line.unit} on hand
                      </span>
                    </div>
                  ))}
                </div>

                {hasShortage && (
                  <div className="mt-3 flex items-start gap-1.5 border-t border-[var(--border)] pt-2.5 text-xs text-amber-400">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    <span>
                      Not enough ingredient stock for this batch — logging it will let
                      ingredients go negative. Restock first if you can.
                    </span>
                  </div>
                )}
              </div>
            ) : productId ? (
              <p className="text-xs text-[var(--muted)]">
                No recipe set for this product yet — production will be logged without
                affecting ingredient stock.{" "}
                <Link href="/recipes" className="text-[var(--primary)] hover:underline">
                  Set up a recipe
                </Link>
              </p>
            ) : null}

            <button
              disabled={saving}
              className="w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add Production"}
            </button>
          </form>
        </div>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[var(--muted)]">Recent Production</h2>
            <Link
              href="/production/history"
              className="flex items-center gap-1.5 text-sm text-[var(--primary)] hover:underline"
            >
              <History size={14} />
              View full history
            </Link>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
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