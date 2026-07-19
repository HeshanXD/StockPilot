"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Download, Truck, Trash2 } from "lucide-react";

const PAYMENT_STATUSES = ["unpaid", "partial", "paid"];

const PAYMENT_BADGE_STYLES = {
  paid: "bg-green-500/10 text-green-400",
  partial: "bg-amber-500/10 text-amber-400",
  unpaid: "bg-red-500/10 text-red-400",
};

export default function DispatchHistory() {
  const [history, setHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const [productFilter, setProductFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  async function load() {
    setLoading(true);

    const [
      { data: dispatchData, error: dispatchError },
      { data: productData },
      { data: customerData },
    ] = await Promise.all([
      supabase
        .from("dispatch")
        .select(
          `id, quantity, payment_status, created_at, products(id, name), customers(id, name)`
        )
        .order("created_at", { ascending: false }),
      supabase.from("products").select("id, name"),
      supabase.from("customers").select("id, name"),
    ]);

    if (dispatchError) {
      console.log(dispatchError);
    } else {
      setHistory(dispatchData || []);
    }

    setProducts(productData || []);
    setCustomers(customerData || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return history.filter((item) => {
      if (productFilter !== "all" && String(item.products?.id) !== String(productFilter)) {
        return false;
      }

      if (customerFilter !== "all" && String(item.customers?.id) !== String(customerFilter)) {
        return false;
      }

      if (paymentFilter !== "all" && item.payment_status !== paymentFilter) {
        return false;
      }

      const itemDate = new Date(item.created_at);

      if (fromDate && itemDate < new Date(fromDate)) return false;
      if (toDate && itemDate > new Date(`${toDate}T23:59:59`)) return false;

      return true;
    });
  }, [history, productFilter, customerFilter, paymentFilter, fromDate, toDate]);

  const totalUnits = filtered.reduce((sum, item) => sum + item.quantity, 0);

  function exportCsv() {
    const rows = [
      ["Product", "Customer", "Quantity", "Payment Status", "Date"],
      ...filtered.map((item) => [
        item.products?.name || "Unknown",
        item.customers?.name || "Unknown",
        item.quantity,
        item.payment_status,
        new Date(item.created_at).toLocaleString(),
      ]),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `dispatch-history-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  async function updatePaymentStatus(id, status) {
    const { error } = await supabase
      .from("dispatch")
      .update({ payment_status: status })
      .eq("id", id);

    if (error) {
      alert("Error updating payment status: " + error.message);
    } else {
      load();
    }
  }

  async function deleteRecord(id) {
    if (!confirm("Delete this dispatch record? This can't be undone.")) return;

    setDeletingId(id);
    const { error } = await supabase.from("dispatch").delete().eq("id", id);
    setDeletingId(null);

    if (error) {
      alert("Error deleting record: " + error.message);
    } else {
      load();
    }
  }

  const hasFilters =
    productFilter !== "all" || customerFilter !== "all" || paymentFilter !== "all" || fromDate || toDate;

  return (
    <main className="p-8 text-[var(--text)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dispatch History</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Full log of everything sent out, filterable by product, customer, and date.
          </p>
        </div>

        <button
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-40"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div>
          <label className="mb-1 block text-xs text-[var(--muted)]">Product</label>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            <option value="all">All products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-[var(--muted)]">Customer</label>
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            <option value="all">All customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-[var(--muted)]">Payment</label>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm capitalize"
          >
            <option value="all">All</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-[var(--muted)]">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-[var(--muted)]">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          />
        </div>

        {hasFilters && (
          <button
            onClick={() => {
              setProductFilter("all");
              setCustomerFilter("all");
              setPaymentFilter("all");
              setFromDate("");
              setToDate("");
            }}
            className="text-sm text-[var(--muted)] underline hover:text-[var(--text)]"
          >
            Clear filters
          </button>
        )}

        <div className="ml-auto text-sm text-[var(--muted)]">
          {filtered.length} record{filtered.length === 1 ? "" : "s"} · {totalUnits} units total
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[var(--border)] p-10 text-center text-sm text-[var(--muted)]">
          Loading dispatch history...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--border)] p-12 text-center">
          <Truck size={32} className="text-[var(--muted)]" />
          <p className="text-sm text-[var(--muted)]">
            No dispatch records match these filters.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.products?.name || "Unknown product"}</p>
                    <p className="text-xs text-[var(--muted)]">
                      to {item.customers?.name || "Unknown"} ·{" "}
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-red-400">-{item.quantity}</span>
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
                    onClick={() => deleteRecord(item.id)}
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

          <div className="hidden overflow-x-auto rounded-xl border border-[var(--border)] md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--card)] text-left">
                  <th className="p-3 font-medium text-[var(--muted)]">Product</th>
                  <th className="p-3 font-medium text-[var(--muted)]">Customer</th>
                  <th className="p-3 font-medium text-[var(--muted)]">Quantity</th>
                  <th className="p-3 font-medium text-[var(--muted)]">Payment</th>
                  <th className="p-3 font-medium text-[var(--muted)]">Date</th>
                  <th className="p-3 font-medium text-[var(--muted)]"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--card)]"
                  >
                    <td className="p-3">{item.products?.name || "Unknown product"}</td>
                    <td className="p-3">{item.customers?.name || "Unknown customer"}</td>
                    <td className="p-3 text-red-400">-{item.quantity}</td>
                    <td className="p-3">
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
                    </td>
                    <td className="p-3 text-[var(--muted)]">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => deleteRecord(item.id)}
                        disabled={deletingId === item.id}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        {deletingId === item.id ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}