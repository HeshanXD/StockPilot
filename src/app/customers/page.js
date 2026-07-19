"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Phone, Mail, MapPin } from "lucide-react";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  async function fetchCustomers() {
    setLoading(true);

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.log(error);
    } else {
      setCustomers(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function addCustomer(e) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase.from("customers").insert([
      {
        name,
        email,
        phone,
        address,
      },
    ]);

    setSaving(false);

    if (error) {
      console.log(error);
      alert(error.message);
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      fetchCustomers();
    }
  }

  return (
    <main className="p-8 text-[var(--text)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Everyone you dispatch products to.
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-fit min-w-0 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 text-sm font-semibold text-[var(--muted)]">Add Customer</h2>

          <form onSubmit={addCustomer} className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Customer name"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
              required
            />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            />

            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            />

            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
            />

            <button
              disabled={saving}
              className="w-full rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Adding..." : "Add Customer"}
            </button>
          </form>
        </div>

        <div className="min-w-0">
          <h2 className="mb-4 text-sm font-semibold text-[var(--muted)]">
            Customer List {customers.length > 0 && `(${customers.length})`}
          </h2>

          {loading ? (
            <div className="rounded-xl border border-[var(--border)] p-10 text-center text-sm text-[var(--muted)]">
              Loading customers...
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--border)] p-10 text-center">
              <Users size={28} className="text-[var(--muted)]" />
              <p className="text-sm text-[var(--muted)]">No customers added yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
                >
                  <p className="font-semibold">{customer.name}</p>

                  {customer.email && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[var(--muted)]">
                      <Mail size={13} />
                      {customer.email}
                    </p>
                  )}

                  {customer.phone && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[var(--muted)]">
                      <Phone size={13} />
                      {customer.phone}
                    </p>
                  )}

                  {customer.address && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--muted)]">
                      <MapPin size={13} />
                      {customer.address}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}