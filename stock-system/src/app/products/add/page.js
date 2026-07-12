"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AddProduct() {

  const router = useRouter();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [minimumStock, setMinimumStock] = useState("");


  async function handleSubmit(e) {

    e.preventDefault();


    const { error } = await supabase
      .from("products")
      .insert([
        {
          name: name,
          quantity: Number(quantity),
          minimum_stock: Number(minimumStock),
        },
      ]);



    if (error) {

      console.log(error);
      alert("Error adding product");

    } else {

      router.push("/products");

    }

  }



  return (

    <main className="p-8">


      <div className="max-w-md rounded-lg border p-6 shadow">


        <h1 className="mb-6 text-2xl font-bold">
          Add Product
        </h1>



        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >



          <div>

            <label className="block mb-1">
              Product Name
            </label>


            <input

              type="text"

              value={name}

              onChange={(e)=>setName(e.target.value)}

              placeholder="Example: Chocolate Cookies"

              className="w-full rounded border p-2"

              required

            />

          </div>




          <div>

            <label className="block mb-1">
              Starting Quantity
            </label>


            <input

              type="number"

              value={quantity}

              onChange={(e)=>setQuantity(e.target.value)}

              placeholder="Example: 100"

              className="w-full rounded border p-2"

              required

            />

          </div>




          <div>

            <label className="block mb-1">
              Minimum Stock Level
            </label>


            <input

              type="number"

              value={minimumStock}

              onChange={(e)=>setMinimumStock(e.target.value)}

              placeholder="Example: 20"

              className="w-full rounded border p-2"

              required

            />

          </div>




          <button

            type="submit"

            className="w-full rounded bg-black px-4 py-2 text-white"

          >

            Save Product

          </button>



        </form>


      </div>


    </main>

  );

}