"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Customers() {

  const [customers, setCustomers] = useState([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");


  async function fetchCustomers() {

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("id", { ascending: false });


    if (error) {
      console.log(error);
    } else {
      setCustomers(data);
    }

  }



  useEffect(() => {

    fetchCustomers();

  }, []);




  async function addCustomer(e) {

    e.preventDefault();


    const { error } = await supabase
      .from("customers")
      .insert([
        {
          name,
          phone,
          address,
        },
      ]);



    if (error) {

      console.log(error);
      alert(error.message);

    } else {

      setName("");
      setPhone("");
      setAddress("");

      fetchCustomers();

    }

  }





  return (

    <main className="p-8">


      <h1 className="text-2xl font-bold mb-6">
        Customers
      </h1>



      <div className="grid gap-8 md:grid-cols-2">



        <div className="rounded-lg border p-6 shadow">


          <h2 className="text-xl font-semibold mb-4">
            Add Customer
          </h2>



          <form
            onSubmit={addCustomer}
            className="space-y-4"
          >


            <input

              value={name}

              onChange={(e)=>setName(e.target.value)}

              placeholder="Customer name"

              className="w-full border rounded p-2"

              required

            />


            <input

              value={phone}

              onChange={(e)=>setPhone(e.target.value)}

              placeholder="Phone number"

              className="w-full border rounded p-2"

            />



            <input

              value={address}

              onChange={(e)=>setAddress(e.target.value)}

              placeholder="Address"

              className="w-full border rounded p-2"

            />



            <button

              className="w-full rounded bg-black p-2 text-white"

            >

              Add Customer

            </button>



          </form>


        </div>





        <div>


          <h2 className="text-xl font-semibold mb-4">
            Customer List
          </h2>



          <div className="space-y-3">


            {customers.map((customer)=>(


              <div

                key={customer.id}

                className="rounded border p-4"

              >

                <p className="font-bold">
                  {customer.name}
                </p>


                <p>
                  {customer.phone}
                </p>


                <p>
                  {customer.address}
                </p>


              </div>


            ))}


          </div>


        </div>


      </div>



    </main>

  );

}