"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Production() {

  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [productionHistory, setProductionHistory] = useState([]);

  async function fetchProducts() {

    const { data, error } = await supabase
      .from("products")
      .select("*");

    if (error) {
      console.log(error);
    } else {
      setProducts(data);
    }
  }

  async function fetchProductionHistory() {

  const { data, error } = await supabase
    .from("production")
    .select(`
      id,
      quantity,
      created_at,
      products(name)
    `)
    .order("created_at", { ascending: false });


  if (error) {
    console.log(error);
  } else {
    setProductionHistory(data);
  }

}

  useEffect(() => {
    fetchProducts();
    fetchProductionHistory();
  }, []);


  async function addProduction(e) {

    e.preventDefault();


    const { error } = await supabase
      .from("production")
      .insert([
        {
          product_id: productId,
          quantity: Number(quantity),
        },
      ]);


    if (error) {
      console.log(error);
      alert("Error adding production");
    } else {
      alert("Production added");

      setProductId("");
      setQuantity("");
      fetchProductionHistory();
    }

  }


  return (
    <main className="p-8">

      <h1 className="text-2xl font-bold mb-6">
        Production
      </h1>


      <div className="max-w-md border rounded-lg p-6 shadow">

        <form
          onSubmit={addProduction}
          className="space-y-4"
        >

          <div>

            <label className="block mb-1">
              Select Product
            </label>

            <select
              value={productId}
              onChange={(e)=>setProductId(e.target.value)}
              className="w-full border rounded p-2"
            >

              <option value="">
                Choose product
              </option>


              {products.map((product)=>(
                <option
                  key={product.id}
                  value={product.id}
                >
                  {product.name}
                </option>
              ))}

            </select>

          </div>


          <div>

            <label className="block mb-1">
              Quantity Produced
            </label>

            <input
              type="number"
              value={quantity}
              onChange={(e)=>setQuantity(e.target.value)}
              className="w-full border rounded p-2"
            />

          </div>


          <button
            className="w-full bg-black text-white rounded p-2"
          >
            Add Production
          </button>


        </form>

      </div>
      
      <div className="mt-8">

  <h2 className="text-xl font-bold mb-4">
    Production History
  </h2>


  <div className="border rounded-lg overflow-hidden">

    <table className="w-full">

      <thead>
        <tr className="border-b">

          <th className="p-3 text-left">
            Product
          </th>

          <th className="p-3 text-left">
            Quantity
          </th>

          <th className="p-3 text-left">
            Date
          </th>

        </tr>
      </thead>


      <tbody>

        {productionHistory.map((item)=>(

          <tr key={item.id} className="border-b">

            <td className="p-3">
              {item.products.name}
            </td>

            <td className="p-3">
              +{item.quantity}
            </td>

            <td className="p-3">
              {new Date(item.created_at).toLocaleDateString()}
            </td>

          </tr>

        ))}

      </tbody>

    </table>

  </div>

</div>

    </main>
  );
}