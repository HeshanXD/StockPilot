import { supabase } from "./supabase";


export async function getCurrentStock(product) {

  const { data: production, error: productionError } = await supabase
    .from("production")
    .select("quantity")
    .eq("product_id", product.id);


  const { data: dispatch, error: dispatchError } = await supabase
    .from("dispatch")
    .select("quantity")
    .eq("product_id", product.id);


  if (productionError || dispatchError) {
    console.log("Stock calculation error");
    return product.quantity;
  }


  const totalProduction = production.reduce(
    (sum, item) => sum + item.quantity,
    0
  );


  const totalDispatch = dispatch.reduce(
    (sum, item) => sum + item.quantity,
    0
  );


  return (
    product.quantity +
    totalProduction -
    totalDispatch
  );

}