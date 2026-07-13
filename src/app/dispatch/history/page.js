"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Download, Truck } from "lucide-react";

export default function DispatchHistory() {
  const [history, setHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [productFilter, setProductFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);

      const [
        { data: dispatchData, error: dispatchError },
        { data: productData },
        { data: customerData },
      ] = await Promise.all([
        supabase
          .from("dispatch")
          .select(`id, quantity, created_at, products(id, name), customers(id, name)`)
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

    load();
  }, []);

  const filtered = useMemo(() => {
    return history.filter((item) => {
      if (productFilter !== "all" && item.products?.id !== productFilter) {
        return false;
      }

      if (customerFilter !== "all" && item.customers?.id !== customerFilter) {
        return false;
      }

      const itemDate = new Date(item.created_at);

      if (fromDate && itemDate < new Date(fromDate)) return false;
      if (toDate && itemDate > new Date(`${toDate}T23:59:59`)) return false;

      return true;
    });
  }, [history, productFilter, customerFilter, fromDate, toDate]);

  const totalUnits = filtered.reduce((sum, item) => sum + item.quantity, 0);

  function exportCsv() {
    const rows = [
      ["Product", "Customer", "Quantity", "Date"],
      ...filtered.map((item) => [
        item.products?.name || "Unknown",
        item.customers?.name || "Unknown",
        item.quantity,
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

  const hasFilters =
    productFilter !== "all" || customerFilter !== "all" || fromDate || toDate;

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

      {/* Filters */}
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

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--border)]">
        {loading ? (
          <div className="p-10 text-center text-sm text-[var(--muted)]">
            Loading dispatch history...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <Truck size={32} className="text-[var(--muted)]" />
            <p className="text-sm text-[var(--muted)]">
              No dispatch records match these filters.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--card)] text-left">
                <th className="p-3 font-medium text-[var(--muted)]">Product</th>
                <th className="p-3 font-medium text-[var(--muted)]">Customer</th>
                <th className="p-3 font-medium text-[var(--muted)]">Quantity</th>
                <th className="p-3 font-medium text-[var(--muted)]">Date</th>
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
                  <td className="p-3 text-[var(--muted)]">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}