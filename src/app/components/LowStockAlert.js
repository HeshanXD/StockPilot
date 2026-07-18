"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getCurrentStock } from "@/lib/stock";
import { getIngredientStock } from "@/lib/ingredients";
import { company } from "@/config/company";
import { AlertTriangle, X, Package, Wheat } from "lucide-react";

// Pages where a login/auth screen is showing — never pop this up there.
const SKIP_PATHS = ["/login", "/signup"];

export default function LowStockAlert() {
  const pathname = usePathname();
  const [lowProducts, setLowProducts] = useState([]);
  const [lowIngredients, setLowIngredients] = useState([]);
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (SKIP_PATHS.some((p) => pathname?.startsWith(p))) return;

    // Only show once per browser tab session, not on every page navigation.
    if (sessionStorage.getItem("lowStockDismissed") === "true") return;

    async function check() {
      const { data: products } = await supabase.from("products").select("*");

      let lowP = [];
      for (const product of products || []) {
        const current = await getCurrentStock(product);
        if (product.minimum_stock && current <= product.minimum_stock) {
          lowP.push({ name: product.name, stock: current });
        }
      }
      setLowProducts(lowP);

      let lowI = [];
      if (company.features.ingredients) {
        const { data: ingredients } = await supabase.from("ingredients").select("*");

        for (const ingredient of ingredients || []) {
          const current = await getIngredientStock(ingredient);
          if (ingredient.minimum_stock && current <= ingredient.minimum_stock) {
            lowI.push({ name: ingredient.name, stock: current, unit: ingredient.unit });
          }
        }
        setLowIngredients(lowI);
      }

      if (lowP.length > 0 || lowI.length > 0) {
        setVisible(true);
      }

      setChecked(true);
    }

    check();
    // Re-runs on route change on purpose — cheap queries, and it means the
    // popup can catch a shortage that appeared after the user logged in.
    // sessionStorage dismissal above still stops repeat popups either way.
  }, [pathname]);

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem("lowStockDismissed", "true");
  }

  if (!checked || !visible) return null;

  const totalCount = lowProducts.length + lowIngredients.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
              <AlertTriangle size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text)]">Low Stock Warning</h2>
              <p className="text-xs text-[var(--muted)]">
                {totalCount} item{totalCount === 1 ? "" : "s"} need attention
              </p>
            </div>
          </div>

          <button
            onClick={dismiss}
            className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--background)] hover:text-[var(--text)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-64 space-y-4 overflow-y-auto">
          {lowIngredients.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]">
                <Wheat size={13} />
                INGREDIENTS — may delay production
              </p>
              <div className="space-y-1.5">
                {lowIngredients.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm"
                  >
                    <span>{item.name}</span>
                    <span className="font-medium text-amber-400">
                      {item.stock} {item.unit} left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lowProducts.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]">
                <Package size={13} />
                FINISHED GOODS
              </p>
              <div className="space-y-1.5">
                {lowProducts.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm"
                  >
                    <span>{item.name}</span>
                    <span className="font-medium text-amber-400">{item.stock} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={dismiss}
            className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--background)]"
          >
            Dismiss
          </button>
          <Link
            href={lowIngredients.length > 0 ? "/ingredients" : "/products"}
            onClick={dismiss}
            className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-90"
          >
            Review Stock
          </Link>
        </div>
      </div>
    </div>
  );
}