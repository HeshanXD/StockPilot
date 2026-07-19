"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCurrentStock } from "@/lib/stock";
import { Truck, History, Trash2 } from "lucide-react";

const PAYMENT_STATUSES = ["unpaid", "partial", "paid"];

const PAYMENT_BADGE_STYLES = {
  paid: "bg-green-500/10 text-green-400",
  partial: "bg-amber-500/10 text-amber-400",
  unpaid: "bg-red-500/10 text-red-400",
};

export default function Dispatch() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [dispatchHistory, setDispatchHistory] = useState([]);
  const [stockByProduct, setStockByProduct] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [productId, setProductId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("unpaid");

  async function fetchData() {
    setLoading(true);

    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("*");

    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .select("*");

    const { data: dispatchData, error: dispatchError } = await supabase
      .from("dispatch")
      .select(`id, quantity, payment_status, created_at, products(id, name), customers(name)`)
      .order("created_at", { ascending: false })
      .limit(10);

    if (productError || customerError || dispatchError) {
      console.log(productError || customerError || dispatchError);
      setLoading(false);
      return;
    }

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

  const selectedProduct = products.find((p) => String(p.id) === String(productId));
  const availableStock = selectedProduct ? stockByProduct[selectedProduct.id] : null;
  const overDispatching =
    availableStock !== null && Number(quantity) > (availableStock ?? 0);

  async function addDispatch(e) {
    e.preventDefault();

    if (overDispatching) {
      if (!confirm("This dispatch is more than the current stock on hand. Continue anyway?")) {
        return;
      }
    }

    setSaving(true);

    const { error } = await supabase.from("dispatch").insert([
      {
        product_id: productId,
        customer_id: customerId,
        quantity: Number(quantity),
        payment_status: paymentStatus,
      },
    ]);

    setSaving(false);

    if (error) {
      console.log(error);
      alert(error.message);
    } else {
      setProductId("");
      setCustomerId("");
      setQuantity("");
      setPaymentStatus("unpaid");
      fetchData();
    }
  }

  async function updatePaymentStatus(id, status) {
    const { error } = await supabase
      .from("dispatch")
      .update({ payment_status: status })
      .eq("id", id);

    if (error) {
      alert("Error updating payment status: " + error.message);
    } else {
      fetchData();
    }
  }

  async function deleteDispatch(id) {
    if (!confirm("Delete this dispatch record? This can't be undone.")) return;

    setDeletingId(id);
    const { error } = await supabase.from("dispatch").delete().eq("id", id);
    setDeletingId(null);

    if (error) {
      alert("Error deleting dispatch: " + error.message);
    } else {
      fetchData();
    }
  }

  return (
    <main className="p-8 text-[var(--text)]">
      <h1 className="mb-6 text-2xl font-bold">Dispatch</h1>

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-fit min-w-0 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 text-sm font-semibold text-[var(--muted)]">Log Dispatch</h2>

          <form onSubmit={addDispatch} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Select Product</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
                required
              >
                <option value="">Choose product</option>
                {products.map((product) => (
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
              <label className="mb-1.5 block text-sm font-medium">Select Customer</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
                required
              >
                <option value="">Choose customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Quantity Dispatched</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
                required
              />
              {overDispatching && (
                <p className="mt-1.5 text-xs text-amber-400">
                  This is more than the current stock on hand.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm capitalize outline-none focus:border-[var(--primary)]"
              >
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status} className="capitalize">
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <button
              disabled={saving}
              className="w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add Dispatch"}
            </button>
          </form>
        </div>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[var(--muted)]">Recent Dispatches</h2>
            <Link
              href="/dispatch/history"
              className="flex items-center gap-1.5 text-sm text-[var(--primary)] hover:underline"
            >
              <History size={14} />
              View full history
            </Link>
          </div>

          {loading ? (
            <div className="rounded-xl border border-[var(--border)] p-10 text-center text-sm text-[var(--muted)]">
              Loading...
            </div>
          ) : dispatchHistory.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--border)] p-10 text-center">
              <Truck size={28} className="text-[var(--muted)]" />
              <p className="text-sm text-[var(--muted)]">No dispatches logged yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dispatchHistory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{item.products?.name || "Unknown"}</p>
                      <p className="text-xs text-[var(--muted)]">
                        to {item.customers?.name || "Unknown"} ·{" "}
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold text-red-400">
                      -{item.quantity}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={item.payment_status}
                      onChange={(e) => updatePaymentStatus(item.id, e.target.value)}
                      className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium capitalize outline-none ${
                        PAYMENT_BADGE_STYLES[item.payment_status] || PAYMENT_BADGE_STYLES.unpaid
                      }`}
                    >
                      {PAYMENT_STATUSES.map((status) => (
                        <option key={status} value={status} className="bg-[var(--card)] text-[var(--text)]">
                          {status}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => deleteDispatch(item.id)}
                      disabled={deletingId === item.id}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                      {deletingId === item.id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}