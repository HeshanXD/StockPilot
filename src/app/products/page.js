"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getCurrentStock } from "@/lib/stock";
import { Package, Plus, Trash2, ArchiveRestore } from "lucide-react";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [stockByProduct, setStockByProduct] = useState({});
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);

  async function fetchProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setProducts(data || []);

    const stockMap = {};
    for (const product of data || []) {
      stockMap[product.id] = await getCurrentStock(product);
    }
    setStockByProduct(stockMap);

    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  async function deleteOrArchive(product) {
    if (!confirm(`Delete "${product.name}"? This can't be undone.`)) return;

    setWorkingId(product.id);

    const { error } = await supabase.from("products").delete().eq("id", product.id);

    if (!error) {
      setWorkingId(null);
      fetchProducts();
      return;
    }

    if (error.code === "23503") {
      const wantsArchive = confirm(
        `"${product.name}" has production, dispatch, or recipe history, so it can't be fully deleted without losing that history.\n\nArchive it instead? It will disappear from all "choose product" dropdowns, but stay visible here and in your reports.`
      );

      if (wantsArchive) {
        const { error: archiveError } = await supabase
          .from("products")
          .update({ is_active: false })
          .eq("id", product.id);

        if (archiveError) {
          alert("Error archiving product: " + archiveError.message);
        } else {
          fetchProducts();
        }
      }
    } else {
      alert("Error deleting product: " + error.message);
    }

    setWorkingId(null);
  }

  async function restoreProduct(product) {
    setWorkingId(product.id);

    const { error } = await supabase
      .from("products")
      .update({ is_active: true })
      .eq("id", product.id);

    setWorkingId(null);

    if (error) {
      alert("Error restoring product: " + error.message);
    } else {
      fetchProducts();
    }
  }

  return (
    <main className="p-8 text-[var(--text)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Everything you manufacture, with live stock levels.
          </p>
        </div>

        <Link
          href="/products/add"
          className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[var(--border)] p-10 text-center text-sm text-[var(--muted)]">
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--border)] p-12 text-center">
          <Package size={32} className="text-[var(--muted)]" />
          <p className="text-sm text-[var(--muted)]">No products added yet.</p>
          <Link
            href="/products/add"
            className="mt-1 text-sm font-medium text-[var(--primary)] hover:underline"
          >
            Add your first product
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {products.map((product) => {
              const stock = stockByProduct[product.id] ?? product.quantity;
              const isLow = product.minimum_stock && stock <= product.minimum_stock;
              const isArchived = product.is_active === false;

              return (
                <div
                  key={product.id}
                  className={`rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 ${
                    isArchived ? "opacity-60" : ""
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <p className="font-semibold">{product.name}</p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        isArchived
                          ? "bg-slate-500/10 text-slate-400"
                          : isLow
                          ? "bg-red-500/10 text-red-400"
                          : "bg-green-500/10 text-green-400"
                      }`}
                    >
                      {isArchived ? "Archived" : isLow ? "Low stock" : "Healthy"}
                    </span>
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-[var(--muted)]">Current Stock</p>
                      <p className="font-medium">{stock}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--muted)]">Minimum</p>
                      <p className="font-medium text-[var(--muted)]">
                        {product.minimum_stock ?? "—"}
                      </p>
                    </div>
                  </div>

                  {isArchived ? (
                    <button
                      onClick={() => restoreProduct(product)}
                      disabled={workingId === product.id}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] py-2 text-xs font-medium text-green-400 transition hover:bg-green-500/10 disabled:opacity-50"
                    >
                      <ArchiveRestore size={14} />
                      {workingId === product.id ? "Restoring..." : "Restore"}
                    </button>
                  ) : (
                    <button
                      onClick={() => deleteOrArchive(product)}
                      disabled={workingId === product.id}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      {workingId === product.id ? "Working..." : "Delete"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-[var(--border)] md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--card)] text-left">
                  <th className="p-3 font-medium text-[var(--muted)]">Product</th>
                  <th className="p-3 font-medium text-[var(--muted)]">Current Stock</th>
                  <th className="p-3 font-medium text-[var(--muted)]">Minimum</th>
                  <th className="p-3 font-medium text-[var(--muted)]">Status</th>
                  <th className="p-3 font-medium text-[var(--muted)]"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const stock = stockByProduct[product.id] ?? product.quantity;
                  const isLow = product.minimum_stock && stock <= product.minimum_stock;
                  const isArchived = product.is_active === false;

                  return (
                    <tr
                      key={product.id}
                      className={`border-b border-[var(--border)] last:border-0 hover:bg-[var(--card)] ${
                        isArchived ? "opacity-60" : ""
                      }`}
                    >
                      <td className="p-3 font-medium">{product.name}</td>
                      <td className="p-3">{stock}</td>
                      <td className="p-3 text-[var(--muted)]">
                        {product.minimum_stock ?? "—"}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            isArchived
                              ? "bg-slate-500/10 text-slate-400"
                              : isLow
                              ? "bg-red-500/10 text-red-400"
                              : "bg-green-500/10 text-green-400"
                          }`}
                        >
                          {isArchived ? "Archived" : isLow ? "Low stock" : "Healthy"}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {isArchived ? (
                          <button
                            onClick={() => restoreProduct(product)}
                            disabled={workingId === product.id}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-green-400 transition hover:bg-green-500/10 disabled:opacity-50"
                          >
                            <ArchiveRestore size={14} />
                            {workingId === product.id ? "Restoring..." : "Restore"}
                          </button>
                        ) : (
                          <button
                            onClick={() => deleteOrArchive(product)}
                            disabled={workingId === product.id}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                            {workingId === product.id ? "Working..." : "Delete"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}