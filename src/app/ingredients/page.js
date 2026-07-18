"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getIngredientStock } from "@/lib/ingredients";
import { Wheat, Plus, Trash2, PackagePlus } from "lucide-react";

export default function Ingredients() {
  const [ingredients, setIngredients] = useState([]);
  const [stockByIngredient, setStockByIngredient] = useState({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [restockingId, setRestockingId] = useState(null);
  const [restockAmount, setRestockAmount] = useState("");
  const [savingRestock, setSavingRestock] = useState(false);
  const [editingMarginId, setEditingMarginId] = useState(null);
  const [marginValue, setMarginValue] = useState("");
  const [savingMargin, setSavingMargin] = useState(false);

  async function fetchIngredients() {
    setLoading(true);

    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setIngredients(data || []);

    const stockMap = {};
    for (const ingredient of data || []) {
      stockMap[ingredient.id] = await getIngredientStock(ingredient);
    }
    setStockByIngredient(stockMap);

    setLoading(false);
  }

  useEffect(() => {
    fetchIngredients();
  }, []);

  async function deleteIngredient(id, name) {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;

    setDeletingId(id);
    const { error } = await supabase.from("ingredients").delete().eq("id", id);
    setDeletingId(null);

    if (error) {
      alert("Error deleting ingredient: " + error.message);
    } else {
      fetchIngredients();
    }
  }

  async function submitRestock(ingredientId) {
    if (!restockAmount || Number(restockAmount) <= 0) return;

    setSavingRestock(true);

    const { error } = await supabase.from("ingredient_restocks").insert([
      {
        ingredient_id: ingredientId,
        quantity: Number(restockAmount),
      },
    ]);

    setSavingRestock(false);

    if (error) {
      alert("Error restocking: " + error.message);
    } else {
      setRestockingId(null);
      setRestockAmount("");
      fetchIngredients();
    }
  }

  async function saveMargin(ingredientId) {
    setSavingMargin(true);

    const { error } = await supabase
      .from("ingredients")
      .update({ safety_margin_percent: Number(marginValue) || 0 })
      .eq("id", ingredientId);

    setSavingMargin(false);

    if (error) {
      alert("Error updating margin: " + error.message);
    } else {
      setEditingMarginId(null);
      setMarginValue("");
      fetchIngredients();
    }
  }

  return (
    <main className="p-8 text-[var(--text)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ingredients</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Raw materials used to make your products.
          </p>
        </div>

        <Link
          href="/ingredients/add"
          className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus size={16} />
          Add Ingredient
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        {loading ? (
          <div className="p-10 text-center text-sm text-[var(--muted)]">
            Loading ingredients...
          </div>
        ) : ingredients.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <Wheat size={32} className="text-[var(--muted)]" />
            <p className="text-sm text-[var(--muted)]">No ingredients added yet.</p>
            <Link
              href="/ingredients/add"
              className="mt-1 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Add your first ingredient
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--card)] text-left">
                <th className="p-3 font-medium text-[var(--muted)]">Ingredient</th>
                <th className="p-3 font-medium text-[var(--muted)]">Current Stock</th>
                <th className="p-3 font-medium text-[var(--muted)]">Minimum</th>
                <th className="p-3 font-medium text-[var(--muted)]">Margin</th>
                <th className="p-3 font-medium text-[var(--muted)]">Status</th>
                <th className="p-3 font-medium text-[var(--muted)]"></th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ingredient) => {
                const stock = stockByIngredient[ingredient.id] ?? ingredient.starting_stock;
                const isLow = ingredient.minimum_stock && stock <= ingredient.minimum_stock;
                const isRestocking = restockingId === ingredient.id;
                const isEditingMargin = editingMarginId === ingredient.id;

                return (
                  <tr
                    key={ingredient.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--card)]"
                  >
                    <td className="p-3 font-medium">{ingredient.name}</td>
                    <td className="p-3">
                      {stock} {ingredient.unit}
                    </td>
                    <td className="p-3 text-[var(--muted)]">
                      {ingredient.minimum_stock ?? "—"} {ingredient.unit}
                    </td>
                    <td className="p-3">
                      {isEditingMargin ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            autoFocus
                            value={marginValue}
                            onChange={(e) => setMarginValue(e.target.value)}
                            className="w-16 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm outline-none focus:border-[var(--primary)]"
                          />
                          <button
                            onClick={() => saveMargin(ingredient.id)}
                            disabled={savingMargin}
                            className="rounded-lg bg-[var(--primary)] px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                          >
                            {savingMargin ? "..." : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingMarginId(null)}
                            className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingMarginId(ingredient.id);
                            setMarginValue(String(ingredient.safety_margin_percent ?? 0));
                          }}
                          className="text-[var(--muted)] underline decoration-dotted hover:text-[var(--text)]"
                        >
                          {ingredient.safety_margin_percent ?? 0}%
                        </button>
                      )}
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
                    <td className="p-3">
                      {isRestocking ? (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            min="0"
                            autoFocus
                            value={restockAmount}
                            onChange={(e) => setRestockAmount(e.target.value)}
                            placeholder="Qty"
                            className="w-20 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm outline-none focus:border-[var(--primary)]"
                          />
                          <button
                            onClick={() => submitRestock(ingredient.id)}
                            disabled={savingRestock}
                            className="rounded-lg bg-[var(--primary)] px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                          >
                            {savingRestock ? "..." : "Save"}
                          </button>
                          <button
                            onClick={() => {
                              setRestockingId(null);
                              setRestockAmount("");
                            }}
                            className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setRestockingId(ingredient.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-green-400 transition hover:bg-green-500/10"
                          >
                            <PackagePlus size={14} />
                            Restock
                          </button>
                          <button
                            onClick={() => deleteIngredient(ingredient.id, ingredient.name)}
                            disabled={deletingId === ingredient.id}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
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