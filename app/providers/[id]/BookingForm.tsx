"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  provider: any;
  session: { userId: string; userType: string } | null;
}

export default function BookingForm({ provider, session }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    serviceId: provider.services[0]?.id?.toString() ?? "",
    bookingDate: "",
    address: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!session) {
    return (
      <div className="bg-white rounded-xl border p-6 sticky top-24">
        <p className="font-bold text-gray-900 mb-2">Book this Professional</p>
        <p className="text-gray-500 text-sm mb-4">Sign in to book this service.</p>
        <Link
          href={`/auth?callbackUrl=/providers/${provider.id}`}
          className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg text-sm font-semibold hover:bg-blue-700"
        >
          Sign In to Book
        </Link>
      </div>
    );
  }

  if (!provider.isVerified) {
    return (
      <div className="bg-white rounded-xl border p-6 sticky top-24">
        <p className="text-gray-500 text-sm">This provider is not yet verified. Bookings will be available once verified.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerId: provider.id,
        serviceId: parseInt(form.serviceId),
        bookingDate: form.bookingDate,
        address: form.address,
        notes: form.notes,
      }),
    });

    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      router.push("/dashboard");
    } else {
      const d = await res.json();
      setError(d.error ?? "Booking failed. Try again.");
    }
  }

  return (
    <div className="bg-white rounded-xl border p-6 sticky top-24">
      <h2 className="font-bold text-gray-900 text-lg mb-4">Book this Professional</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {provider.services.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
            <select
              value={form.serviceId}
              onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {provider.services.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.serviceName} — GH₵ {Number(s.price).toFixed(0)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
          <input
            type="datetime-local"
            required
            value={form.bookingDate}
            onChange={(e) => setForm({ ...form, bookingDate: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="e.g. East Legon, Accra"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Any special requirements…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Booking…" : "Request Booking"}
        </button>
      </form>
    </div>
  );
}
