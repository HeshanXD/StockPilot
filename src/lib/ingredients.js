import { supabase } from "./supabase";

const SAFETY_MARGIN_PERCENT = 10;

const UNIT_INFO = {
  kg: { family: "mass", toBase: 1000 },
  g: { family: "mass", toBase: 1 },
  l: { family: "volume", toBase: 1000 },
  ml: { family: "volume", toBase: 1 },
  pcs: { family: "count", toBase: 1 },
};

export function convertUnits(quantity, fromUnit, toUnit) {
  if (!fromUnit || !toUnit || fromUnit === toUnit) return quantity;

  const from = UNIT_INFO[fromUnit];
  const to = UNIT_INFO[toUnit];

  if (!from || !to || from.family !== to.family) return quantity;

  return (quantity * from.toBase) / to.toBase;
}

export function compatibleUnits(unit) {
  const info = UNIT_INFO[unit];
  if (!info) return [unit];
  return Object.keys(UNIT_INFO).filter((u) => UNIT_INFO[u].family === info.family);
}

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

export async function getRecipe(productId) {
  const { data, error } = await supabase
    .from("product_ingredients")
    .select(
      `id, quantity_per_unit, recipe_unit, ingredients(id, name, unit, starting_stock, minimum_stock)`
    )
    .eq("product_id", productId);

  if (error) {
    console.log(error);
    return [];
  }

  return data || [];
}

export function getUsableStock(stock) {
  const usable = stock * (1 - SAFETY_MARGIN_PERCENT / 100);
  return Math.max(0, usable);
}

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

    const recipeUnit = line.recipe_unit || ingredient.unit;

    const stock = await getIngredientStock(ingredient);
    const usableInIngredientUnit = getUsableStock(stock);
    const usableInRecipeUnit = convertUnits(usableInIngredientUnit, ingredient.unit, recipeUnit);

    const possibleUnits =
      line.quantity_per_unit > 0 ? Math.floor(usableInRecipeUnit / line.quantity_per_unit) : Infinity;

    breakdown.push({
      name: ingredient.name,
      unit: recipeUnit,
      usable: usableInRecipeUnit,
      quantityPerUnit: line.quantity_per_unit,
      possibleUnits,
      isBottleneck: false,
    });

    if (possibleUnits < maxUnits) {
      maxUnits = possibleUnits;
    }
  }

  const finalMax = maxUnits === Infinity ? 0 : maxUnits;

  breakdown.forEach((line) => {
    line.isBottleneck = line.possibleUnits === finalMax;
  });

  return { maxUnits: finalMax, breakdown };
}

export async function checkCombinationFeasibility(lines) {
  const requiredByIngredient = {};

  for (const line of lines) {
    if (!line.productId || !line.quantity) continue;

    const recipe = await getRecipe(line.productId);

    for (const r of recipe) {
      const ingredient = r.ingredients;
      if (!ingredient) continue;

      const recipeUnit = r.recipe_unit || ingredient.unit;
      const neededInRecipeUnit = r.quantity_per_unit * Number(line.quantity);
      const neededInIngredientUnit = convertUnits(neededInRecipeUnit, recipeUnit, ingredient.unit);

      if (!requiredByIngredient[ingredient.id]) {
        const stock = await getIngredientStock(ingredient);
        const usable = getUsableStock(stock);

        requiredByIngredient[ingredient.id] = {
          name: ingredient.name,
          unit: ingredient.unit,
          required: 0,
          available: usable,
        };
      }

      requiredByIngredient[ingredient.id].required += neededInIngredientUnit;
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

export async function checkIngredientsForProduction(productId, quantityToProduce) {
  const recipe = await getRecipe(productId);

  const requirements = [];

  for (const line of recipe) {
    const ingredient = line.ingredients;
    if (!ingredient) continue;

    const recipeUnit = line.recipe_unit || ingredient.unit;
    const requiredInRecipeUnit = line.quantity_per_unit * quantityToProduce;

    const stock = await getIngredientStock(ingredient);
    const availableInRecipeUnit = convertUnits(stock, ingredient.unit, recipeUnit);
    const requiredInIngredientUnit = convertUnits(requiredInRecipeUnit, recipeUnit, ingredient.unit);

    requirements.push({
      ingredientId: ingredient.id,
      name: ingredient.name,
      unit: recipeUnit,
      required: requiredInRecipeUnit,
      available: availableInRecipeUnit,
      short: availableInRecipeUnit < requiredInRecipeUnit,
      requiredInIngredientUnit,
    });
  }

  return requirements;
}