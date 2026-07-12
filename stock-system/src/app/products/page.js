"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Products() {

  const [products, setProducts] = useState([]);

  async function fetchProducts() {

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.log(error);
    } else {
      setProducts(data);
    }
  }


  async function deleteProduct(id) {

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);


    if (error) {
      console.log(error);
      alert("Error deleting product");
    } else {
      fetchProducts();
    }
  }


  useEffect(() => {
    fetchProducts();
  }, []);


  return (
    <main className="p-8">

      <div className="flex justify-between items-center mb-6">

        <h1 className="text-2xl font-bold">
          Products
        </h1>

        <a
          href="/products/add"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Add Product
        </a>

      </div>


      <div className="overflow-x-auto">

        <table className="w-full border">

          <thead>

            <tr className="border-b">

              <th className="p-3 text-left">
                Product Name
              </th>

              <th className="p-3 text-left">
                Quantity
              </th>

              <th className="p-3 text-left">
                Action
              </th>

            </tr>

          </thead>


          <tbody>

            {products.length === 0 ? (

              <tr>
                <td className="p-3">
                  No products added yet.
                </td>
              </tr>

            ) : (

              products.map((product) => (

                <tr
                  key={product.id}
                  className="border-b"
                >

                  <td className="p-3">
                    {product.name}
                  </td>


                  <td className="p-3">
                    {product.quantity}
                  </td>


                  <td className="p-3">

                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="rounded bg-red-600 px-3 py-1 text-white"
                    >
                      Delete
                    </button>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </main>
  );
}