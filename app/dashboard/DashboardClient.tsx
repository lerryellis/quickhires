"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  user: any;
  userType: string;
  provider: any;
  customerBookings: any[];
  providerBookings: any[];
  notifications: any[];
  unreadCount: number;
  commissions: any[];
}

export default function DashboardClient({
  user,
  userType,
  provider,
  customerBookings,
  providerBookings,
  notifications,
  unreadCount,
  commissions,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const isProvider = userType === "provider" || userType === "both";
  const isCustomer = userType === "customer" || userType === "both";

  const tabs = [
    { key: "overview", label: "Overview" },
    ...(isCustomer ? [{ key: "my_bookings", label: "My Bookings" }] : []),
    ...(isProvider ? [{ key: "manage_bookings", label: "Manage Bookings" }] : []),
    ...(isProvider ? [{ key: "services", label: "My Services" }] : []),
    { key: "notifications", label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
  ];

  async function updateBooking(bookingId: number, status: string) {
    setLoadingId(bookingId);
    await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoadingId(null);
    router.refresh();
  }

  async function markNotificationsRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    router.refresh();
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      accepted: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return (
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colors[status] ?? "bg-gray-100 text-gray-700"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const totalEarned = providerBookings
    .filter((b) => b.payment?.paymentStatus === "completed")
    .reduce((s: number, b: any) => s + Number(b.service.price), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">Quick<span className="text-gray-900">Hire</span></Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/categories" className="text-gray-600 hover:text-gray-900">Services</Link>
            <Link href="/messages" className="text-gray-600 hover:text-gray-900">Messages</Link>
            <Link href="/api/auth/signout" className="text-gray-600 hover:text-gray-900">Logout</Link>
          </div>
        </nav>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.fullName ?? "User"}</h1>
          <p className="text-gray-500 text-sm mt-1 capitalize">{userType} account</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b mb-8 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition ${
                tab === t.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="grid md:grid-cols-3 gap-6">
            {isCustomer && (
              <div className="bg-white border rounded-xl p-6">
                <p className="text-gray-500 text-sm">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{customerBookings.length}</p>
              </div>
            )}
            {isProvider && (
              <>
                <div className="bg-white border rounded-xl p-6">
                  <p className="text-gray-500 text-sm">Jobs Received</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{providerBookings.length}</p>
                </div>
                <div className="bg-white border rounded-xl p-6">
                  <p className="text-gray-500 text-sm">Total Earned</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">GH₵ {totalEarned.toFixed(2)}</p>
                </div>
                <div className="bg-white border rounded-xl p-6">
                  <p className="text-gray-500 text-sm">Commission Owed</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">
                    GH₵ {commissions.reduce((s: number, c: any) => s + Number(c.amount), 0).toFixed(2)}
                  </p>
                </div>
              </>
            )}
            <div className="bg-white border rounded-xl p-6">
              <p className="text-gray-500 text-sm">Unread Notifications</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{unreadCount}</p>
            </div>
          </div>
        )}

        {/* My Bookings (customer) */}
        {tab === "my_bookings" && (
          <div className="space-y-4">
            {customerBookings.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p>No bookings yet.</p>
                <Link href="/categories" className="mt-3 inline-block text-blue-600 hover:underline text-sm">Browse services →</Link>
              </div>
            ) : (
              customerBookings.map((b) => (
                <div key={b.id} className="bg-white border rounded-xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{b.service.serviceName}</p>
                      <p className="text-gray-500 text-sm">by {b.provider.user.fullName}</p>
                      <p className="text-gray-400 text-xs mt-1">{new Date(b.bookingDate).toLocaleString("en-GH", { timeZone: "Africa/Accra" })}</p>
                      <p className="text-gray-400 text-xs">{b.address}</p>
                    </div>
                    <div className="text-right">
                      {statusBadge(b.status)}
                      <p className="text-gray-900 font-semibold mt-2">GH₵ {Number(b.service.price).toFixed(2)}</p>
                    </div>
                  </div>

                  {b.status === "completed" && !b.payment && (
                    <div className="mt-4 pt-4 border-t">
                      <PaymentWidget bookingId={b.id} />
                    </div>
                  )}

                  {b.status === "completed" && b.payment?.paymentStatus === "completed" && b.reviews.length === 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <ReviewWidget bookingId={b.id} providerId={b.providerId} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Manage Bookings (provider) */}
        {tab === "manage_bookings" && (
          <div className="space-y-4">
            {providerBookings.length === 0 ? (
              <p className="text-center py-16 text-gray-400">No bookings received yet.</p>
            ) : (
              providerBookings.map((b) => (
                <div key={b.id} className="bg-white border rounded-xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{b.service.serviceName}</p>
                      <p className="text-gray-500 text-sm">from {b.user.fullName} · {b.user.phone}</p>
                      <p className="text-gray-400 text-xs mt-1">{new Date(b.bookingDate).toLocaleString("en-GH", { timeZone: "Africa/Accra" })}</p>
                      <p className="text-gray-400 text-xs">{b.address}</p>
                      {b.notes && <p className="text-gray-500 text-xs mt-1 italic">"{b.notes}"</p>}
                    </div>
                    <div className="text-right">
                      {statusBadge(b.status)}
                      <p className="text-gray-900 font-semibold mt-2">GH₵ {Number(b.service.price).toFixed(2)}</p>
                    </div>
                  </div>
                  {b.status === "pending" && (
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <button
                        onClick={() => updateBooking(b.id, "accepted")}
                        disabled={loadingId === b.id}
                        className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateBooking(b.id, "cancelled")}
                        disabled={loadingId === b.id}
                        className="bg-red-100 text-red-700 text-sm px-4 py-2 rounded-lg hover:bg-red-200 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {b.status === "accepted" && (
                    <div className="mt-4 pt-4 border-t">
                      <button
                        onClick={() => updateBooking(b.id, "completed")}
                        disabled={loadingId === b.id}
                        className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Mark as Completed
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Services */}
        {tab === "services" && provider && (
          <div className="space-y-4">
            {provider.services.length === 0 ? (
              <p className="text-center py-16 text-gray-400">No services added yet.</p>
            ) : (
              provider.services.map((s: any) => (
                <div key={s.id} className="bg-white border rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{s.serviceName}</p>
                    {s.description && <p className="text-gray-500 text-sm mt-1">{s.description}</p>}
                  </div>
                  <span className="text-blue-600 font-semibold">GH₵ {Number(s.price).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Notifications */}
        {tab === "notifications" && (
          <div>
            {unreadCount > 0 && (
              <button onClick={markNotificationsRead} className="mb-4 text-sm text-blue-600 hover:underline">
                Mark all as read
              </button>
            )}
            {notifications.length === 0 ? (
              <p className="text-center py-16 text-gray-400">No notifications.</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`bg-white border rounded-xl p-4 ${!n.isRead ? "border-blue-200 bg-blue-50" : ""}`}
                  >
                    <p className="font-medium text-gray-900 text-sm">{n.title}</p>
                    <p className="text-gray-500 text-sm mt-1">{n.message}</p>
                    <p className="text-gray-400 text-xs mt-2">{new Date(n.createdAt).toLocaleString("en-GH", { timeZone: "Africa/Accra" })}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentWidget({ bookingId }: { bookingId: number }) {
  const router = useRouter();
  const [method, setMethod] = useState("mobile_money");
  const [loading, setLoading] = useState(false);

  async function pay() {
    setLoading(true);
    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, paymentMethod: method }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
      >
        <option value="mobile_money">Mobile Money</option>
        <option value="card">Card</option>
        <option value="cash">Cash</option>
      </select>
      <button
        onClick={pay}
        disabled={loading}
        className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Processing…" : "Pay Now"}
      </button>
    </div>
  );
}

function ReviewWidget({ bookingId, providerId }: { bookingId: number; providerId: number }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, providerId, rating, comment }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Leave a review</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} onClick={() => setRating(s)} className={s <= rating ? "text-yellow-500" : "text-gray-300"}>
            ★
          </button>
        ))}
      </div>
      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience…"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
      />
      <button
        onClick={submit}
        disabled={loading}
        className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit Review"}
      </button>
    </div>
  );
}
