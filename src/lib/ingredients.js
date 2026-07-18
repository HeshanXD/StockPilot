import { supabase } from "./supabase";

// Mirrors the pattern in lib/stock.js: stock is always computed fresh from
// a starting amount plus every restock minus every recorded usage, rather
// than trusting a single running number that could drift out of sync.
export async function getIngredientStock(ingredient) {
  const { data: restocks, error: restockError } = await supabase
    .from("ingredient_restocks")
    .select("quantity")
    .eq("ingredient_id", ingredient.id);

  const { data: usage, error: usageError } = await supabase
    .from("ingredient_usage")
    .select("quantity")
    .eq("ingredient_id", ingredient.id);

  if (restockError || usageError) {
    console.log("Ingredient stock calculation error");
    return ingredient.starting_stock;
  }

  const totalRestocked = restocks.reduce((sum, item) => sum + item.quantity, 0);
  const totalUsed = usage.reduce((sum, item) => sum + item.quantity, 0);

  return ingredient.starting_stock + totalRestocked - totalUsed;
}

// The recipe (bill of materials) for a product: which ingredients, and how
// much of each is needed to make ONE unit of that product.
export async function getRecipe(productId) {
  const { data, error } = await supabase
    .from("product_ingredients")
    .select(`id, quantity_per_unit, ingredients(id, name, unit, starting_stock, minimum_stock)`)
    .eq("product_id", productId);

  if (error) {
    console.log(error);
    return [];
  }

  return data || [];
}

// The amount of an ingredient you're actually willing to use for planning
// purposes — total stock minus the safety margin you never want to touch.
export function getUsableStock(stock, marginPercent) {
  const margin = marginPercent || 0;
  const usable = stock * (1 - margin / 100);
  return Math.max(0, usable);
}

// For a single product: how many units could you make right now, given
// current ingredient stock and each ingredient's safety margin? The answer
// is capped by whichever ingredient runs out first (the bottleneck).
export async function getMaxProducible(productId) {
  const recipe = await getRecipe(productId);

  if (recipe.length === 0) {
    return { maxUnits: null, breakdown: [] };
  }

  let maxUnits = Infinity;
  const breakdown = [];

  for (const line of recipe) {
    const ingredient = line.ingredients;
    if (!ingredient) continue;

    const stock = await getIngredientStock(ingredient);
    const usable = getUsableStock(stock, ingredient.safety_margin_percent);
    const possibleUnits =
      line.quantity_per_unit > 0 ? Math.floor(usable / line.quantity_per_unit) : Infinity;

    breakdown.push({
      name: ingredient.name,
      unit: ingredient.unit,
      usable,
      quantityPerUnit: line.quantity_per_unit,
      possibleUnits,
      isBottleneck: false,
    });

    if (possibleUnits < maxUnits) {
      maxUnits = possibleUnits;
    }
  }

  const finalMax = maxUnits === Infinity ? 0 : maxUnits;

  // Mark whichever ingredient(s) are the actual limiting factor.
  breakdown.forEach((line) => {
    line.isBottleneck = line.possibleUnits === finalMax;
  });

  return { maxUnits: finalMax, breakdown };
}

// For a custom combination of products + desired quantities: aggregate the
// total ingredient demand across all of them, and check it against usable
// stock. Tells you exactly which ingredients (if any) fall short, and by
// how much, rather than just a plain yes/no.
export async function checkCombinationFeasibility(lines) {
  const requiredByIngredient = {};

  for (const line of lines) {
    if (!line.productId || !line.quantity) continue;

    const recipe = await getRecipe(line.productId);

    for (const r of recipe) {
      const ingredient = r.ingredients;
      if (!ingredient) continue;

      const need = r.quantity_per_unit * Number(line.quantity);

      if (!requiredByIngredient[ingredient.id]) {
        const stock = await getIngredientStock(ingredient);
        const usable = getUsableStock(stock, ingredient.safety_margin_percent);

        requiredByIngredient[ingredient.id] = {
          name: ingredient.name,
          unit: ingredient.unit,
          required: 0,
          available: usable,
        };
      }

      requiredByIngredient[ingredient.id].required += need;
    }
  }

  const results = Object.values(requiredByIngredient).map((r) => ({
    ...r,
    short: r.required > r.available,
    shortfall: Math.max(0, r.required - r.available),
  }));

  const feasible = results.length > 0 && results.every((r) => !r.short);

  return { feasible, results };
}

// Given a product and a quantity about to be produced, work out exactly how
// much of each ingredient that requires, and whether there's enough on hand.
export async function checkIngredientsForProduction(productId, quantityToProduce) {
  const recipe = await getRecipe(productId);

  const requirements = [];

  for (const line of recipe) {
    const ingredient = line.ingredients;
    if (!ingredient) continue;

    const required = line.quantity_per_unit * quantityToProduce;
    const available = await getIngredientStock(ingredient);

    requirements.push({
      ingredientId: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      required,
      available,
      short: available < required,
    });
  }

  return requirements;
}