"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCurrentStock } from "@/lib/stock";
import {
  Package,
  Factory,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Plus,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

// Feature toggles from environment variables
const features = {
  pricing: process.env.NEXT_PUBLIC_FEATURE_PRICING === "true",
  customers: process.env.NEXT_PUBLIC_FEATURE_CUSTOMERS === "true",
  revenue: process.env.NEXT_PUBLIC_FEATURE_REVENUE === "true",
};

export default function Dashboard() {
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalStock, setTotalStock] = useState(0);
  const [todayProduction, setTodayProduction] = useState(0);
  const [todayDispatch, setTodayDispatch] = useState(0);

  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [weekTrend, setWeekTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  // Panels
  const [outstandingOrders, setOutstandingOrders] = useState([]);
  const [inactiveCustomers, setInactiveCustomers] = useState([]);
  const [topProduct, setTopProduct] = useState(null);
  const [totalPaidOrders, setTotalPaidOrders] = useState(0);

  async function loadDashboard() {
    setLoading(true);

    const { data: products } = await supabase.from("products").select("*");
    setTotalProducts(products?.length || 0);

    let stock = 0;
    let low = [];
    for (const product of products || []) {
      const current = await getCurrentStock(product);
      stock += current;
      if (product.minimum_stock && current <= product.minimum_stock) {
        low.push({ name: product.name, stock: current });
      }
    }
    setTotalStock(stock);
    setLowStockItems(low);

    const today = new Date().toISOString().split("T")[0];

    const { data: production } = await supabase
      .from("production")
      .select(`id, quantity, created_at, products(name)`)
      .order("created_at", { ascending: false });

    const { data: dispatch } = await supabase
      .from("dispatch")
      .select(`id, quantity, created_at, payment_status, products(name), customers(name)`)
      .order("created_at", { ascending: false });

    const { data: customers } = await supabase
      .from("customers")
      .select(`id, name, created_at`);

    const todayProductionData = production?.filter((x) => x.created_at.startsWith(today)) || [];
    const todayDispatchData = dispatch?.filter((x) => x.created_at.startsWith(today)) || [];

    setTodayProduction(todayProductionData.reduce((sum, x) => sum + x.quantity, 0));
    setTodayDispatch(todayDispatchData.reduce((sum, x) => sum + x.quantity, 0));

    // Last 7 days trend
    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });

    const trend = days.map((day) => ({
      day,
      label: new Date(day).toLocaleDateString(undefined, { weekday: "short" }),
      produced: (production || [])
        .filter((x) => x.created_at.startsWith(day))
        .reduce((sum, x) => sum + x.quantity, 0),
      dispatched: (dispatch || [])
        .filter((x) => x.created_at.startsWith(day))
        .reduce((sum, x) => sum + x.quantity, 0),
    }));
    setWeekTrend(trend);

    const activities = [
      ...(production || []).map((item) => ({
        id: "p" + item.id,
        type: "production",
        text: `${item.quantity} units of ${item.products.name} produced`,
        date: item.created_at,
      })),
      ...(dispatch || []).map((item) => ({
        id: "d" + item.id,
        type: "dispatch",
        text: `${item.quantity} units of ${item.products.name} sent to ${item.customers?.name || "Unknown"}`,
        date: item.created_at,
      })),
    ];
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    setRecentActivity(activities.slice(0, 8));

    // --- Payments panel ---
    const outstanding = (dispatch || []).filter((d) => d.payment_status !== "paid");
    setOutstandingOrders(outstanding);

    // --- Customer insights panel ---
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const inactive = (customers || []).filter((c) => {
      const lastOrder = (dispatch || [])
        .filter((d) => d.customers?.name === c.name)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      return !lastOrder || new Date(lastOrder.created_at) < cutoff;
    });
    setInactiveCustomers(inactive);

    // --- Revenue snapshot panel (by quantity since no price yet) ---
    const paidOrders = (dispatch || []).filter((d) => d.payment_status === "paid");
    setTotalPaidOrders(paidOrders.length);
    const productCounts = {};
    paidOrders.forEach((d) => {
      const productName = d.products?.name || "Unknown";
      productCounts[productName] = (productCounts[productName] || 0) + d.quantity;
    });
    const top = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];
    setTopProduct(top ? { name: top[0], quantity: top[1] } : null);

    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const maxTrendValue = useMemo(() => {
    const values = weekTrend.flatMap((d) => [d.produced, d.dispatched]);
    return Math.max(1, ...values);
  }, [weekTrend]);

  return (
    <main className="space-y-8 p-8 text-[var(--text)]">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <QuickAction href="/production" icon={<Factory size={14} />} label="Log Production" />
        <QuickAction href="/dispatch" icon={<Truck size={14} />} label="Log Dispatch" />
        <QuickAction href="/products" icon={<Package size={14} />} label="Products" />
        <QuickAction href="/products/new" icon={<Plus size={14} />} label="Add Product" />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Products" value={totalProducts} icon={<Package size={18} />} />
        <StatCard title="Current Stock" value={totalStock} icon={<Package size={18} />} />
        <StatCard
          title="Today's Production"
          value={todayProduction}
          icon={<Factory size={18} />}
          accent="text-green-400"
        />
        <StatCard
          title="Today's Dispatch"
          value={todayDispatch}
          icon={<Truck size={18} />}
          accent="text-blue-400"
        />
      </div>

      {/* 7-day trend chart */}
      <section>
        <h2 className="mb-4 text-lg font-bold">7-Day Trend</h2>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="grid grid-cols-7 gap-2">
            {weekTrend.map((d) => (
              <div key={d.day} className="flex flex-col items-center gap-2">
                <div className="flex h-32 w-full items-end justify-center gap-1">
                  <div
                    className="w-1/2 max-w-[18px] rounded-t bg-blue-500"
                    style={{ height: `${Math.max(3, (d.produced / maxTrendValue) * 100)}%` }}
                    title={`Produced: ${d.produced}`}
                  ></div>
                  <div
                    className="w-1/2 max-w-[18px] rounded-t bg-emerald-500"
                    style={{ height: `${Math.max(3, (d.dispatched / maxTrendValue) * 100)}%` }}
                    title={`Dispatched: ${d.dispatched}`}
                  ></div>
                </div>
                <span className="text-[10px] text-[var(--muted)]">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        {/* Stock alerts */}
        <section>
          <h2 className="mb-4 text-lg font-bold">Stock Alerts</h2>
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
            {lowStockItems.length === 0 ? (
              <div className="flex items-center justify-center gap-2 p-6 text-sm text-[var(--muted)]">
                <CheckCircle2 size={18} className="text-green-400" />
                All stock levels are healthy
              </div>
            ) : (
              lowStockItems.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between border-b border-[var(--border)] p-4 last:border-0"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <AlertTriangle size={16} className="text-amber-400" />
                    {item.name}
                  </span>
                  <span className="text-sm font-semibold text-red-400">{item.stock} left</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent activity */}
        <section>
          <h2 className="mb-4 text-lg font-bold">Recent Activity</h2>
          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
            {recentActivity.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--muted)]">
                Nothing logged yet.
              </div>
            ) : (
              recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 border-b border-[var(--border)] p-4 last:border-0"
                >
                  <div className="mt-0.5 shrink-0">
                    {item.type === "production" ? (
                      <TrendingUp size={16} className="text-green-400" />
                    ) : (
                      <TrendingDown size={16} className="text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm">{item.text}</p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                      {new Date(item.date).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Payments panel */}
      {features.pricing && (
        <section>
          <h2 className="mb-4 text-lg font-bold">Payments</h2>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            {outstandingOrders.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No outstanding payments.</p>
            ) : (
              <p className="text-sm">{outstandingOrders.length} unpaid/partial orders.</p>
            )}
          </div>
        </section>
      )}

      {/* Customer Insights panel */}
      {features.customers && (
        <section>
          <h2 className="mb-4 text-lg font-bold">Customer Insights</h2>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            {inactiveCustomers.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">All customers active.</p>
            ) : (
              <p className="text-sm">{inactiveCustomers.length} customers inactive (30+ days).</p>
            )}
          </div>
        </section>
      )}

      {/* Revenue Snapshot panel */}
      {features.revenue && (
        <section>
          <h2 className="mb-4 text-lg font-bold">Revenue Snapshot</h2>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <p className="text-sm">Total paid orders: {totalPaidOrders}</p>
            {topProduct && (
              <p className="text-sm">
                Top product: {topProduct.name} ({topProduct.quantity} units)
              </p>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

function StatCard({ title, value, icon, accent }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-[var(--primary)]/40">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">{title}</p>
        <span className="text-[var(--muted)]">{icon}</span>
      </div>
      <h2 className={`mt-3 text-3xl font-bold ${accent || ""}`}>{value}</h2>
    </div>
  );
}

function QuickAction({ href, icon, label }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-medium transition hover:border-[var(--primary)]/40 hover:text-[var(--primary)]"
    >
      {icon}
      {label}
    </Link>
  );
}