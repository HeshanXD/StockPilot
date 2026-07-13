"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentStock } from "@/lib/stock";
import { BarChart3, Package, TrendingUp, TrendingDown } from "lucide-react";

export default function Reports() {
  const [products, setProducts] = useState([]);
  const [production, setProduction] = useState([]);
  const [dispatch, setDispatch] = useState([]);
  const [stockByProduct, setStockByProduct] = useState({});
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30); // days

  useEffect(() => {
    async function load() {
      setLoading(true);

      const [{ data: productData }, { data: productionData }, { data: dispatchData }] =
        await Promise.all([
          supabase.from("products").select("*"),
          supabase
            .from("production")
            .select("id, quantity, created_at, products(id, name)"),
          supabase
            .from("dispatch")
            .select("id, quantity, created_at, products(id, name), customers(id, name)"),
        ]);

      setProducts(productData || []);
      setProduction(productionData || []);
      setDispatch(dispatchData || []);

      const stockMap = {};
      for (const product of productData || []) {
        stockMap[product.id] = await getCurrentStock(product);
      }
      setStockByProduct(stockMap);

      setLoading(false);
    }

    load();
  }, []);

  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - range);
    return d;
  }, [range]);

  const productionInRange = production.filter((p) => new Date(p.created_at) >= cutoff);
  const dispatchInRange = dispatch.filter((d) => new Date(d.created_at) >= cutoff);

  const totalProduced = productionInRange.reduce((sum, p) => sum + p.quantity, 0);
  const totalDispatched = dispatchInRange.reduce((sum, d) => sum + d.quantity, 0);

  const byProduct = {};
  for (const p of productionInRange) {
    const name = p.products?.name || "Unknown";
    byProduct[name] = (byProduct[name] || 0) + p.quantity;
  }
  const topProducts = Object.entries(byProduct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxProduced = topProducts.length ? topProducts[0][1] : 1;

  const byCustomer = {};
  for (const d of dispatchInRange) {
    const name = d.customers?.name || "Unknown";
    byCustomer[name] = (byCustomer[name] || 0) + d.quantity;
  }
  const topCustomers = Object.entries(byCustomer)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxDispatched = topCustomers.length ? topCustomers[0][1] : 1;

  const lowStock = products
    .filter((p) => p.minimum_stock && stockByProduct[p.id] <= p.minimum_stock)
    .sort((a, b) => stockByProduct[a.id] - stockByProduct[b.id]);

  return (
    <main className="p-8 text-[var(--text)]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Production and dispatch trends across your business.
          </p>
        </div>

        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setRange(days)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                range === days
                  ? "bg-[var(--primary)] text-white"
                  : "border border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-sm text-[var(--muted)]">
          Crunching the numbers...
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard
              label={`Produced (last ${range}d)`}
              value={totalProduced}
              icon={<TrendingUp size={20} className="text-green-400" />}
            />
            <SummaryCard
              label={`Dispatched (last ${range}d)`}
              value={totalDispatched}
              icon={<TrendingDown size={20} className="text-blue-400" />}
            />
            <SummaryCard
              label="Products low on stock"
              value={lowStock.length}
              icon={<Package size={20} className="text-amber-400" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title="Top products by production" icon={<BarChart3 size={18} />}>
              {topProducts.length === 0 ? (
                <EmptyNote text="No production in this period." />
              ) : (
                <div className="space-y-3">
                  {topProducts.map(([name, qty]) => (
                    <BarRow key={name} label={name} value={qty} max={maxProduced} color="bg-blue-500" />
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Top customers by volume" icon={<BarChart3 size={18} />}>
              {topCustomers.length === 0 ? (
                <EmptyNote text="No dispatches in this period." />
              ) : (
                <div className="space-y-3">
                  {topCustomers.map(([name, qty]) => (
                    <BarRow key={name} label={name} value={qty} max={maxDispatched} color="bg-emerald-500" />
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div className="mt-6">
            <Panel title="Low stock watchlist" icon={<Package size={18} />}>
              {lowStock.length === 0 ? (
                <EmptyNote text="Everything is above its minimum stock level." />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-[var(--muted)]">
                      <th className="py-2 font-medium">Product</th>
                      <th className="py-2 font-medium">Current stock</th>
                      <th className="py-2 font-medium">Minimum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map((p) => (
                      <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-2">{p.name}</td>
                        <td className="py-2 text-red-400">{stockByProduct[p.id]}</td>
                        <td className="py-2 text-[var(--muted)]">{p.minimum_stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>
          </div>
        </>
      )}
    </main>
  );
}

function SummaryCard({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">{label}</p>
        {icon}
      </div>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function Panel({ title, icon, children }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="mb-4 flex items-center gap-2 text-[var(--muted)]">
        {icon}
        <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function BarRow({ label, value, max, color }) {
  const pct = Math.max(4, Math.round((value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-[var(--muted)]">{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[var(--background)]">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function EmptyNote({ text }) {
  return <p className="py-6 text-center text-sm text-[var(--muted)]">{text}</p>;
}