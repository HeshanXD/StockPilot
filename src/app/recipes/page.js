"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ClipboardList, Plus, Trash2 } from "lucide-react";

export default function Recipes() {
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [recipeLines, setRecipeLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  const [newIngredientId, setNewIngredientId] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchBaseData() {
    setLoading(true);

    const [{ data: productData }, { data: ingredientData }] = await Promise.all([
      supabase.from("products").select("id, name"),
      supabase.from("ingredients").select("id, name, unit"),
    ]);

    setProducts(productData || []);
    setIngredients(ingredientData || []);
    setLoading(false);
  }

  async function fetchRecipe(productId) {
    setLoadingRecipe(true);

    const { data, error } = await supabase
      .from("product_ingredients")
      .select(`id, quantity_per_unit, ingredients(id, name, unit)`)
      .eq("product_id", productId);

    if (error) {
      console.log(error);
    } else {
      setRecipeLines(data || []);
    }

    setLoadingRecipe(false);
  }

  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchRecipe(selectedProductId);
    } else {
      setRecipeLines([]);
    }
  }, [selectedProductId]);

  const usedIngredientIds = recipeLines.map((line) => line.ingredients?.id);
  const availableIngredients = ingredients.filter((i) => !usedIngredientIds.includes(i.id));

  async function addLine(e) {
    e.preventDefault();
    if (!newIngredientId || !newQuantity) return;

    setSaving(true);

    const { error } = await supabase.from("product_ingredients").insert([
      {
        product_id: selectedProductId,
        ingredient_id: newIngredientId,
        quantity_per_unit: Number(newQuantity),
      },
    ]);

    setSaving(false);

    if (error) {
      alert(error.message);
    } else {
      setNewIngredientId("");
      setNewQuantity("");
      fetchRecipe(selectedProductId);
    }
  }

  async function removeLine(lineId) {
    const { error } = await supabase.from("product_ingredients").delete().eq("id", lineId);

    if (error) {
      alert(error.message);
    } else {
      fetchRecipe(selectedProductId);
    }
  }

  const selectedProduct = products.find((p) => String(p.id) === String(selectedProductId));

  return (
    <main className="p-8 text-[var(--text)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Recipes</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Define how much of each ingredient goes into one unit of a product.
          Production will automatically deduct these amounts as you log it.
        </p>
      </div>

      <div className="max-w-xl">
        <label className="mb-1.5 block text-sm font-medium">Select Product</label>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
          disabled={loading}
        >
          <option value="">
            {loading ? "Loading products..." : "Choose a product"}
          </option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProductId && (
        <div className="mt-6 max-w-xl rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 text-sm font-semibold text-[var(--muted)]">
            Recipe for {selectedProduct?.name}
          </h2>

          {loadingRecipe ? (
            <p className="py-6 text-center text-sm text-[var(--muted)]">Loading recipe...</p>
          ) : recipeLines.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <ClipboardList size={26} className="text-[var(--muted)]" />
              <p className="text-sm text-[var(--muted)]">
                No ingredients added to this recipe yet.
              </p>
            </div>
          ) : (
            <div className="mb-5 space-y-2">
              {recipeLines.map((line) => (
                <div
                  key={line.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                >
                  <span>{line.ingredients?.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--muted)]">
                      {line.quantity_per_unit} {line.ingredients?.unit} per unit
                    </span>
                    <button
                      onClick={() => removeLine(line.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {availableIngredients.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">
              {ingredients.length === 0
                ? "You haven't added any ingredients yet — add some on the Ingredients page first."
                : "Every ingredient you have is already in this recipe."}
            </p>
          ) : (
            <form onSubmit={addLine} className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[140px]">
                <label className="mb-1 block text-xs text-[var(--muted)]">Ingredient</label>
                <select
                  value={newIngredientId}
                  onChange={(e) => setNewIngredientId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                  required
                >
                  <option value="">Choose ingredient</option>
                  {availableIngredients.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-28">
                <label className="mb-1 block text-xs text-[var(--muted)]">Qty per unit</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                <Plus size={15} />
                {saving ? "Adding..." : "Add"}
              </button>
            </form>
          )}
        </div>
      )}
    </main>
  );
}