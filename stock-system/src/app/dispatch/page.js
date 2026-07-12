"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Dispatch() {

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [dispatchHistory, setDispatchHistory] = useState([]);

  const [productId, setProductId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [quantity, setQuantity] = useState("");


  async function fetchData() {

    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("*");


    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .select("*");


    const { data: dispatchData, error: dispatchError } = await supabase
      .from("dispatch")
      .select(`
        id,
        quantity,
        created_at,
        products(name),
        customers(name)
      `)
      .order("created_at", { ascending: false });



    if (productError || customerError || dispatchError) {

      console.log(
        productError || customerError || dispatchError
      );

    } else {

      setProducts(productData);
      setCustomers(customerData);
      setDispatchHistory(dispatchData);

    }

  }



  useEffect(() => {

    fetchData();

  }, []);




  async function addDispatch(e) {

    e.preventDefault();


    const { error } = await supabase
      .from("dispatch")
      .insert([
        {
          product_id: productId,
          customer_id: customerId,
          quantity: Number(quantity),
        },
      ]);



    if (error) {

      console.log(error);
      alert(error.message);

    } else {

      alert("Dispatch added");

      setProductId("");
      setCustomerId("");
      setQuantity("");

      fetchData();

    }

  }




  return (

    <main className="p-8">


      <h1 className="text-2xl font-bold mb-6">
        Dispatch
      </h1>



      <div className="max-w-md border rounded-lg p-6 shadow">


        <form
          onSubmit={addDispatch}
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
              required
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
              Select Customer
            </label>


            <select
              value={customerId}
              onChange={(e)=>setCustomerId(e.target.value)}
              className="w-full border rounded p-2"
              required
            >

              <option value="">
                Choose customer
              </option>


              {customers.map((customer)=>(

                <option
                  key={customer.id}
                  value={customer.id}
                >

                  {customer.name}

                </option>

              ))}


            </select>

          </div>




          <div>

            <label className="block mb-1">
              Quantity Dispatched
            </label>


            <input

              type="number"

              value={quantity}

              onChange={(e)=>setQuantity(e.target.value)}

              className="w-full border rounded p-2"

              required

            />

          </div>




          <button

            className="w-full bg-black text-white rounded p-2"

          >

            Add Dispatch

          </button>


        </form>


      </div>





      <div className="mt-8">


        <h2 className="text-xl font-bold mb-4">
          Dispatch History
        </h2>



        <div className="border rounded-lg overflow-hidden">


          <table className="w-full">


            <thead>

              <tr className="border-b">


                <th className="p-3 text-left">
                  Product
                </th>


                <th className="p-3 text-left">
                  Customer
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


              {dispatchHistory.map((item)=>(


                <tr
                  key={item.id}
                  className="border-b"
                >


                  <td className="p-3">
                    {item.products.name}
                  </td>


                  <td className="p-3">
                    {item.customers.name}
                  </td>


                  <td className="p-3">
                    {item.quantity}
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