"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCurrentStock } from "@/lib/stock";
import { Truck, History } from "lucide-react";

export default function Dispatch() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [dispatchHistory, setDispatchHistory] = useState([]);
  const [stockByProduct, setStockByProduct] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [productId, setProductId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [quantity, setQuantity] = useState("");

  async function fetchData() {
    setLoading(true);

    const { data: productData } = await supabase
      .from("products")
      .select("*");

    const { data: customerData } = await supabase
      .from("customers")
      .select("*");

    const { data: dispatchData } = await supabase
      .from("dispatch")
      .select(`id, quantity, created_at, products(id, name), customers(name)`)
      .order("created_at", { ascending: false })
      .limit(10);

    setProducts(productData || []);
    setCustomers(customerData || []);
    setDispatchHistory(dispatchData || []);

    const stockMap = {};

    for (const product of productData || []) {
      stockMap[product.id] = await getCurrentStock(product);
    }

    setStockByProduct(stockMap);

    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const selectedProduct = products.find(
    (p) => p.id === productId
  );

  const availableStock = selectedProduct
    ? stockByProduct[selectedProduct.id] ?? 0
    : null;

  const overDispatching =
    availableStock !== null &&
    Number(quantity) > availableStock;

  async function addDispatch(e) {
    e.preventDefault();

    const qty = Number(quantity);

    if (!qty || qty <= 0) return;

    if (overDispatching) {
      if (
        !confirm(
          "This dispatch is more than the current stock on hand. Continue anyway?"
        )
      ) {
        return;
      }
    }

    setSaving(true);

    const { error } = await supabase
      .from("dispatch")
      .insert([
        {
          product_id: productId,
          customer_id: customerId,
          quantity: qty,
        },
      ]);

    setSaving(false);

    if (!error) {
      setProductId("");
      setCustomerId("");
      setQuantity("");
      fetchData();
    }
  }

  return (
    <main className="p-8 text-[var(--text)]">
      <div className="mx-auto w-full max-w-6xl">

        <h1 className="mb-6 text-2xl font-bold">
          Dispatch
        </h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* LEFT */}
          <div className="h-fit rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">

            <h2 className="mb-4 text-sm font-semibold text-[var(--muted)]">
              Log Dispatch
            </h2>

            <form onSubmit={addDispatch} className="space-y-4">

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Select Product
                </label>

                <select
                  value={productId}
                  onChange={(e)=>setProductId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
                  required
                >
                  <option value="">
                    Choose product
                  </option>

                  {products.map((product)=>(
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>

                {selectedProduct && (
                  <p className="mt-1.5 text-xs text-[var(--muted)]">
                    {availableStock} in stock
                  </p>
                )}
              </div>


              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Select Customer
                </label>

                <select
                  value={customerId}
                  onChange={(e)=>setCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
                  required
                >
                  <option value="">
                    Choose customer
                  </option>

                  {customers.map((customer)=>(
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}

                </select>
              </div>


              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Quantity Dispatched
                </label>

                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e)=>setQuantity(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
                  required
                />

                {overDispatching && (
                  <p className="mt-1.5 text-xs text-amber-400">
                    This is more than the current stock on hand.
                  </p>
                )}
              </div>


              <button
                disabled={saving}
                className="w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Add Dispatch"}
              </button>

            </form>

          </div>



          {/* RIGHT */}
          <div>

            <div className="mb-4 flex items-center justify-between">

              <h2 className="text-sm font-semibold text-[var(--muted)]">
                Recent Dispatches
              </h2>

              <Link
                href="/dispatch/history"
                className="flex items-center gap-1.5 text-sm text-[var(--primary)] hover:underline"
              >
                <History size={14}/>
                View full history
              </Link>

            </div>


            <div className="overflow-hidden rounded-xl border border-[var(--border)]">

              {loading ? (

                <div className="p-10 text-center text-sm text-[var(--muted)]">
                  Loading...
                </div>

              ) : dispatchHistory.length === 0 ? (

                <div className="flex flex-col items-center gap-3 p-10 text-center">

                  <Truck size={28} className="text-[var(--muted)]"/>

                  <p className="text-sm text-[var(--muted)]">
                    No dispatches logged yet.
                  </p>

                </div>

              ) : (

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[600px] text-sm">

                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--card)] text-left">

                        <th className="p-3">
                          Product
                        </th>

                        <th className="p-3">
                          Customer
                        </th>

                        <th className="p-3">
                          Quantity
                        </th>

                        <th className="p-3 whitespace-nowrap">
                          Date
                        </th>

                      </tr>
                    </thead>


                    <tbody>

                      {dispatchHistory.map((item)=>(

                        <tr
                          key={item.id}
                          className="border-b border-[var(--border)] last:border-0"
                        >

                          <td className="p-3">
                            {item.products?.name || "Unknown"}
                          </td>


                          <td className="p-3">
                            {item.customers?.name || "Unknown"}
                          </td>


                          <td className="p-3 text-red-400">
                            -{item.quantity}
                          </td>


                          <td className="p-3 whitespace-nowrap text-[var(--muted)]">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>


                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          </div>

        </div>

      </div>
    </main>
  );
}