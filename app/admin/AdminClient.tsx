"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  users: any[];
  bookings: any[];
  payments: any[];
  providers: any[];
  verifications: any[];
  feedback: any[];
  totalRevenue: number;
  categories: any[];
}

export default function AdminClient({ users, bookings, payments, providers, verifications, feedback, totalRevenue, categories: initCategories }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [rejectNotes, setRejectNotes] = useState<Record<number, string>>({});
  const [categories, setCategories] = useState(initCategories);

  const completedPayments = payments.filter((p) => p.paymentStatus === "completed");
  const pendingVerifications = verifications.filter((v) => v.status === "pending");
  const unreadFeedback = feedback.filter((f) => !f.isRead).length;
  const activeProviders = providers.filter((p) => p.isAvailable);
  const verifiedProviders = providers.filter((p) => p.isVerified);

  async function adminAction(action: string, targetId: number, extraData?: object) {
    setLoadingId(`${action}-${targetId}`);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, targetId, data: extraData }),
    });
    setLoadingId(null);
    if (res.ok) router.refresh();
    return res;
  }

  function exportCSV(type: string) {
    window.open(`/api/admin/export?type=${type}`, "_blank");
  }

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "analytics", label: "Analytics" },
    { key: "users", label: `Users (${users.length})` },
    { key: "bookings", label: `Bookings (${bookings.length})` },
    { key: "providers", label: `Providers (${providers.length})` },
    { key: "verifications", label: `Verify${pendingVerifications.length > 0 ? ` (${pendingVerifications.length})` : ""}` },
    { key: "feedback", label: `Feedback${unreadFeedback > 0 ? ` (${unreadFeedback})` : ""}` },
    { key: "categories", label: "Categories" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">Quick<span className="text-gray-900">Hire</span></Link>
          <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">Admin Panel</span>
          <Link href="/api/auth/signout" className="text-sm text-gray-600 hover:text-gray-900">Logout</Link>
        </nav>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

        <div className="flex gap-1 border-b mb-8 overflow-x-auto">
          {tabs.map((t) => (
            <button type="button" key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition ${
                tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: users.length, color: "text-gray-900" },
                { label: "Total Bookings", value: bookings.length, color: "text-gray-900" },
                { label: "Completed Payments", value: completedPayments.length, color: "text-green-600" },
                { label: "Platform Revenue (10%)", value: `GH₵ ${totalRevenue.toFixed(2)}`, color: "text-blue-600" },
                { label: "Active Providers", value: activeProviders.length, color: "text-gray-900" },
                { label: "Verified Providers", value: verifiedProviders.length, color: "text-green-600" },
                { label: "Pending Verifications", value: pendingVerifications.length, color: pendingVerifications.length > 0 ? "text-red-600" : "text-gray-900" },
                { label: "Unread Feedback", value: unreadFeedback, color: unreadFeedback > 0 ? "text-yellow-600" : "text-gray-900" },
              ].map((s) => (
                <div key={s.label} className="bg-white border rounded-xl p-5">
                  <p className="text-gray-500 text-sm">{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => exportCSV("bookings")} className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700">↓ Export Bookings CSV</button>
              <button type="button" onClick={() => exportCSV("payments")} className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700">↓ Export Payments CSV</button>
              <button type="button" onClick={() => exportCSV("users")} className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700">↓ Export Users CSV</button>
              <button type="button" onClick={() => exportCSV("providers")} className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700">↓ Export Providers CSV</button>
            </div>
          </div>
        )}

        {/* ── Analytics ────────────────────────────────────────────────────── */}
        {tab === "analytics" && (
          <AnalyticsTab bookings={bookings} payments={payments} users={users} providers={providers} />
        )}

        {/* ── Users ────────────────────────────────────────────────────────── */}
        {tab === "users" && (
          <UsersTab users={users} adminAction={adminAction} loadingId={loadingId} />
        )}

        {/* ── Bookings ─────────────────────────────────────────────────────── */}
        {tab === "bookings" && (
          <BookingsTab bookings={bookings} adminAction={adminAction} loadingId={loadingId} />
        )}

        {/* ── Providers ────────────────────────────────────────────────────── */}
        {tab === "providers" && (
          <ProvidersTab providers={providers} adminAction={adminAction} loadingId={loadingId} />
        )}

        {/* ── Verifications ────────────────────────────────────────────────── */}
        {tab === "verifications" && (
          <div className="space-y-4">
            {verifications.length === 0 && <p className="text-center py-16 text-gray-400">No verification requests.</p>}
            {verifications.map((v) => (
              <div key={v.id} className="bg-white border rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{v.provider.user.fullName}</p>
                    <p className="text-gray-500 text-sm">ID: {v.idType} · {v.idNumber}</p>
                    {v.notes && <p className="text-gray-400 text-xs mt-1">{v.notes}</p>}
                    {v.smileidSummary && <p className="text-green-600 text-xs mt-1">✓ {v.smileidSummary}</p>}
                    {v.documentPath && (
                      <a href={v.documentPath} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs mt-1 block hover:underline">View document</a>
                    )}
                    <p className="text-gray-400 text-xs mt-1">{new Date(v.createdAt).toLocaleDateString("en-GH")}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    v.status === "approved" ? "bg-green-100 text-green-700" :
                    v.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                  }`}>{v.status}</span>
                </div>
                {v.status === "pending" && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <input
                      value={rejectNotes[v.id] ?? ""}
                      onChange={(e) => setRejectNotes((r) => ({ ...r, [v.id]: e.target.value }))}
                      placeholder="Rejection notes (optional)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => adminAction("approve_verification", v.id)}
                        disabled={loadingId === `approve_verification-${v.id}`}
                        className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
                        Approve
                      </button>
                      <button type="button" onClick={() => adminAction("reject_verification", v.id, { notes: rejectNotes[v.id] })}
                        disabled={loadingId === `reject_verification-${v.id}`}
                        className="bg-red-100 text-red-700 text-sm px-4 py-2 rounded-lg hover:bg-red-200 disabled:opacity-50">
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Feedback ─────────────────────────────────────────────────────── */}
        {tab === "feedback" && (
          <div className="space-y-4">
            {feedback.map((f) => (
              <div key={f.id} className={`bg-white border rounded-xl p-5 ${!f.isRead ? "border-blue-200" : ""}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{f.user.fullName}</p>
                    <p className="text-yellow-500 text-sm">{"★".repeat(Math.min(f.rating, 5))}</p>
                    <p className="text-xs text-gray-400 capitalize">{f.category}</p>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(f.createdAt).toLocaleDateString("en-GH")}</p>
                </div>
                <p className="text-gray-700 text-sm">{f.message}</p>
                {f.adminReply && (
                  <div className="mt-3 pt-3 border-t bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 font-medium mb-1">Your reply:</p>
                    <p className="text-sm text-gray-700">{f.adminReply}</p>
                  </div>
                )}
                {!f.adminReply && (
                  <div className="mt-3 pt-3 border-t flex gap-2">
                    <input value={replyText[f.id] ?? ""} onChange={(e) => setReplyText({ ...replyText, [f.id]: e.target.value })}
                      placeholder="Write a reply…" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    <button type="button" onClick={() => adminAction("reply_feedback", f.id, { reply: replyText[f.id] })}
                      disabled={!replyText[f.id] || loadingId === `reply_feedback-${f.id}`}
                      className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      Reply
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Categories ───────────────────────────────────────────────────── */}
        {tab === "categories" && (
          <CategoriesTab categories={categories} setCategories={setCategories} adminAction={adminAction} loadingId={loadingId} />
        )}
      </div>
    </div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────────────────────
function AnalyticsTab({ bookings, payments, users, providers }: any) {
  const completedBookings = bookings.filter((b: any) => b.status === "completed");
  const cancelledBookings = bookings.filter((b: any) => b.status === "cancelled");
  const completedPayments = payments.filter((p: any) => p.paymentStatus === "completed");
  const totalRevenue = completedPayments.reduce((s: number, p: any) => s + Number(p.amount) * 0.1, 0);
  const totalPaid = completedPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);

  // Bookings by status
  const statusCounts = ["pending","accepted","completed","cancelled"].map((s) => ({
    status: s,
    count: bookings.filter((b: any) => b.status === s).length,
  }));

  // Revenue by month (last 6 months)
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: d.toLocaleString("en-GH", { month: "short", year: "2-digit" }), month: d.getMonth(), year: d.getFullYear() };
  });
  const revenueByMonth = months.map((m) => ({
    label: m.label,
    revenue: completedPayments
      .filter((p: any) => {
        const d = new Date(p.paymentDate);
        return d.getMonth() === m.month && d.getFullYear() === m.year;
      })
      .reduce((s: number, p: any) => s + Number(p.amount) * 0.1, 0),
  }));

  // Top providers by bookings
  const providerBookingCounts: Record<number, { name: string; count: number }> = {};
  bookings.forEach((b: any) => {
    if (!providerBookingCounts[b.providerId]) {
      providerBookingCounts[b.providerId] = { name: b.provider.user.fullName, count: 0 };
    }
    providerBookingCounts[b.providerId].count++;
  });
  const topProviders = Object.values(providerBookingCounts).sort((a, b) => b.count - a.count).slice(0, 5);

  // Payment methods breakdown
  const methodCounts: Record<string, number> = {};
  completedPayments.forEach((p: any) => {
    methodCounts[p.paymentMethod] = (methodCounts[p.paymentMethod] ?? 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { label: "Total GMV", value: `GH₵ ${totalPaid.toFixed(2)}` },
          { label: "Platform Revenue", value: `GH₵ ${totalRevenue.toFixed(2)}` },
          { label: "Completion Rate", value: bookings.length ? `${Math.round(completedBookings.length / bookings.length * 100)}%` : "—" },
          { label: "Cancellation Rate", value: bookings.length ? `${Math.round(cancelledBookings.length / bookings.length * 100)}%` : "—" },
        ].map((s) => (
          <div key={s.label} className="bg-white border rounded-xl p-5">
            <p className="text-gray-500 text-sm">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bookings by Status */}
        <div className="bg-white border rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Bookings by Status</h3>
          <div className="space-y-3">
            {statusCounts.map(({ status, count }) => (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize text-gray-700">{status}</span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: bookings.length ? `${count / bookings.length * 100}%` : "0%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Month */}
        <div className="bg-white border rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue by Month (GH₵)</h3>
          <div className="space-y-3">
            {revenueByMonth.map(({ label, revenue }) => {
              const maxRev = Math.max(...revenueByMonth.map((m) => m.revenue), 1);
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{label}</span>
                    <span className="font-medium text-gray-900">GH₵ {revenue.toFixed(2)}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${revenue / maxRev * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Providers */}
        <div className="bg-white border rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Top Providers by Bookings</h3>
          {topProviders.length === 0 ? (
            <p className="text-gray-400 text-sm">No booking data yet.</p>
          ) : (
            <div className="space-y-3">
              {topProviders.map(({ name, count }) => {
                const max = topProviders[0].count;
                return (
                  <div key={name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{name}</span>
                      <span className="font-medium text-gray-900">{count} bookings</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${count / max * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="bg-white border rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Payment Methods</h3>
          {Object.keys(methodCounts).length === 0 ? (
            <p className="text-gray-400 text-sm">No payment data yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(methodCounts).map(([method, count]) => (
                <div key={method} className="flex justify-between text-sm">
                  <span className="text-gray-700 capitalize">{method.replace("_", " ")}</span>
                  <span className="font-medium text-gray-900">{count} payments</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab({ users, adminAction, loadingId }: any) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Record<number, any>>({});
  const [search, setSearch] = useState("");

  const filtered = users.filter((u: any) =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  function startEdit(u: any) {
    setEditData((d) => ({ ...d, [u.id]: { fullName: u.fullName, email: u.email, phone: u.phone ?? "", userType: u.userType } }));
    setExpandedId(u.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64" />
      </div>
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["ID","Name","Email","Type","Joined","Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u: any) => (
              <>
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{u.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{u.fullName}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full capitalize">{u.userType}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString("en-GH")}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => expandedId === u.id ? setExpandedId(null) : startEdit(u)}
                        className="text-xs text-blue-600 hover:underline">Edit</button>
                      <button type="button" onClick={() => { if (confirm(`Reset password for ${u.fullName}?`)) adminAction("reset_password", u.id, { newPassword: "QuickHire2024!" }); }}
                        disabled={loadingId === `reset_password-${u.id}`}
                        className="text-xs text-yellow-600 hover:underline">Reset PW</button>
                      <button type="button" onClick={() => { if (confirm(`Delete ${u.fullName}? This cannot be undone.`)) adminAction("delete_user", u.id); }}
                        disabled={loadingId === `delete_user-${u.id}`}
                        className="text-xs text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
                {expandedId === u.id && editData[u.id] && (
                  <tr key={`edit-${u.id}`} className="border-b bg-blue-50">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <input value={editData[u.id].fullName} onChange={(e) => setEditData((d) => ({ ...d, [u.id]: { ...d[u.id], fullName: e.target.value } }))}
                          placeholder="Full name" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        <input value={editData[u.id].email} onChange={(e) => setEditData((d) => ({ ...d, [u.id]: { ...d[u.id], email: e.target.value } }))}
                          placeholder="Email" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        <input value={editData[u.id].phone} onChange={(e) => setEditData((d) => ({ ...d, [u.id]: { ...d[u.id], phone: e.target.value } }))}
                          placeholder="Phone" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        <select aria-label="User type" value={editData[u.id].userType} onChange={(e) => setEditData((d) => ({ ...d, [u.id]: { ...d[u.id], userType: e.target.value } }))}
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                          <option value="customer">Customer</option>
                          <option value="provider">Provider</option>
                          <option value="both">Both</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button type="button" onClick={() => { adminAction("update_user", u.id, editData[u.id]); setExpandedId(null); }}
                          disabled={loadingId === `update_user-${u.id}`}
                          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                          Save
                        </button>
                        <button type="button" onClick={() => setExpandedId(null)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Cancel</button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Bookings Tab ──────────────────────────────────────────────────────────────
function BookingsTab({ bookings, adminAction, loadingId }: any) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = bookings.filter((b: any) => {
    const matchStatus = filter === "all" || b.status === filter;
    const matchSearch = !search || b.user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      b.provider.user.fullName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer/provider…" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64" />
        {["all","pending","accepted","completed","cancelled"].map((s) => (
          <button type="button" key={s} onClick={() => setFilter(s)}
            className={`text-sm px-3 py-2 rounded-lg border capitalize ${filter === s ? "bg-blue-600 text-white border-blue-600" : "text-gray-500 hover:bg-gray-50"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["#","Customer","Provider","Service","Date","Status","Amount","Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((b: any) => (
              <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{b.id}</td>
                <td className="px-4 py-3">{b.user.fullName}</td>
                <td className="px-4 py-3">{b.provider.user.fullName}</td>
                <td className="px-4 py-3">{b.service.serviceName}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(b.bookingDate).toLocaleDateString("en-GH")}</td>
                <td className="px-4 py-3">
                  <select aria-label="Booking status" defaultValue={b.status} onChange={(e) => adminAction("update_booking_status", b.id, { status: e.target.value })}
                    className="border border-gray-200 rounded px-2 py-1 text-xs">
                    {["pending","accepted","completed","cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 font-medium">GH₵ {Number(b.service.price).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <a href={`/receipt/${b.id}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Receipt</a>
                    <button type="button" onClick={() => { if (confirm(`Delete booking #${b.id}?`)) adminAction("delete_booking", b.id); }}
                      disabled={loadingId === `delete_booking-${b.id}`}
                      className="text-xs text-red-600 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Providers Tab ─────────────────────────────────────────────────────────────
function ProvidersTab({ providers, adminAction, loadingId }: any) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="bg-white border rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            {["#","Name","Email","Category","Rating","Verified","Featured","Available","Cap","Actions"].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {providers.map((p: any) => (
            <>
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{p.id}</td>
                <td className="px-4 py-3 font-medium">{p.user.fullName}</td>
                <td className="px-4 py-3 text-gray-500">{p.user.email}</td>
                <td className="px-4 py-3 text-gray-500">{p.serviceCategory}</td>
                <td className="px-4 py-3">★ {Number(p.rating).toFixed(1)}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => adminAction("update_provider", p.id, { isVerified: !p.isVerified })}
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.isVerified ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.isVerified ? "✓ Yes" : "No"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => adminAction("update_provider", p.id, { isFeatured: !p.isFeatured })}
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.isFeatured ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.isFeatured ? "★ Yes" : "No"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {p.isAvailable ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{p.dailyBookingCap === 0 ? "∞" : p.dailyBookingCap}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => setExpandedId(expandedId === p.id ? null : p.id)} className="text-xs text-blue-600 hover:underline">Edit</button>
                </td>
              </tr>
              {expandedId === p.id && (
                <ProviderEditRow key={`edit-${p.id}`} provider={p} adminAction={adminAction} onClose={() => setExpandedId(null)} loadingId={loadingId} />
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProviderEditRow({ provider, adminAction, onClose, loadingId }: any) {
  const [bio, setBio] = useState(provider.bio ?? "");
  const [category, setCategory] = useState(provider.serviceCategory);
  const [cap, setCap] = useState(String(provider.dailyBookingCap));

  return (
    <tr className="border-b bg-blue-50">
      <td colSpan={10} className="px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input value={cap} onChange={(e) => setCap(e.target.value)} placeholder="Daily cap (0=∞)" type="number" min="0" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" rows={2} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-2 mt-3">
          <button type="button" onClick={() => { adminAction("update_provider", provider.id, { bio, serviceCategory: category, dailyBookingCap: cap }); onClose(); }}
            disabled={loadingId === `update_provider-${provider.id}`}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            Save
          </button>
          <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Cancel</button>
        </div>
      </td>
    </tr>
  );
}

// ── Categories Tab ────────────────────────────────────────────────────────────
function CategoriesTab({ categories, setCategories, adminAction, loadingId }: any) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("🔧");
  const [newDesc, setNewDesc] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newOrder, setNewOrder] = useState("0");
  const [savingNew, setSavingNew] = useState(false);

  async function addCategory() {
    setSavingNew(true);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_category", targetId: 0, data: { name: newName, icon: newIcon, description: newDesc, filterKey: newKey || newName.toLowerCase().replace(/\s+/g, "_"), displayOrder: newOrder } }),
    });
    const cat = await res.json();
    if (res.ok) { setCategories((c: any[]) => [...c, cat]); setAdding(false); setNewName(""); setNewIcon("🔧"); setNewDesc(""); setNewKey(""); }
    setSavingNew(false);
  }

  async function toggleCat(id: number) {
    await adminAction("toggle_category", id);
    setCategories((cats: any[]) => cats.map((c) => c.id === id ? { ...c, isVisible: !c.isVisible } : c));
  }

  async function deleteCat(id: number) {
    await adminAction("delete_category", id);
    setCategories((cats: any[]) => cats.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-900">Homepage Categories</h2>
        <button type="button" onClick={() => setAdding(!adding)} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">+ Add Category</button>
      </div>

      {adding && (
        <div className="bg-white border rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name *" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} placeholder="Icon emoji" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24" />
            <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="Filter key (auto if blank)" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input value={newOrder} onChange={(e) => setNewOrder(e.target.value)} placeholder="Display order" type="number" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={addCategory} disabled={savingNew || !newName.trim()}
              className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
              {savingNew ? "Adding…" : "Add"}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["Icon","Name","Filter Key","Order","Visible","Actions"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((c: any) => (
              <tr key={c.id} className={`border-b last:border-0 hover:bg-gray-50 ${!c.isVisible ? "opacity-50" : ""}`}>
                <td className="px-4 py-3 text-2xl">{c.icon}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-gray-400 text-xs font-mono">{c.filterKey}</td>
                <td className="px-4 py-3 text-gray-500">{c.displayOrder}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.isVisible ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.isVisible ? "Yes" : "Hidden"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => toggleCat(c.id)} className="text-xs text-yellow-600 hover:underline">
                      {c.isVisible ? "Hide" : "Show"}
                    </button>
                    <button type="button" onClick={() => { if (confirm(`Delete category "${c.name}"?`)) deleteCat(c.id); }}
                      disabled={loadingId === `delete_category-${c.id}`}
                      className="text-xs text-red-600 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
