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
}

export default function AdminClient({ users, bookings, payments, providers, verifications, feedback, totalRevenue }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<number, string>>({});

  const completedPayments = payments.filter((p) => p.paymentStatus === "completed");
  const pendingVerifications = verifications.filter((v) => v.status === "pending");

  async function adminAction(action: string, targetId: number, extraData?: object) {
    setLoadingId(`${action}-${targetId}`);
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, targetId, data: extraData }),
    });
    setLoadingId(null);
    router.refresh();
  }

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "users", label: `Users (${users.length})` },
    { key: "bookings", label: `Bookings (${bookings.length})` },
    { key: "verifications", label: `Verifications (${pendingVerifications.length})` },
    { key: "feedback", label: `Feedback (${feedback.filter((f) => !f.isRead).length})` },
    { key: "providers", label: `Providers (${providers.length})` },
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
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition ${
                tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { label: "Total Users", value: users.length },
              { label: "Total Bookings", value: bookings.length },
              { label: "Completed Payments", value: completedPayments.length },
              { label: "Platform Revenue (10%)", value: `GH₵ ${totalRevenue.toFixed(2)}` },
            ].map((s) => (
              <div key={s.label} className="bg-white border rounded-xl p-6">
                <p className="text-gray-500 text-sm">{s.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Users */}
        {tab === "users" && (
          <div className="bg-white border rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["ID","Name","Email","Phone","Type","Joined"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">{u.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{u.fullName}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500">{u.phone ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full capitalize">
                        {u.userType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString("en-GH")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bookings */}
        {tab === "bookings" && (
          <div className="bg-white border rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["#","Customer","Provider","Service","Date","Status","Amount"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">{b.id}</td>
                    <td className="px-4 py-3">{b.user.fullName}</td>
                    <td className="px-4 py-3">{b.provider.user.fullName}</td>
                    <td className="px-4 py-3">{b.service.serviceName}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(b.bookingDate).toLocaleDateString("en-GH")}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        b.status === "completed" ? "bg-green-100 text-green-700" :
                        b.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        b.status === "accepted" ? "bg-blue-100 text-blue-700" :
                        "bg-red-100 text-red-700"
                      }`}>{b.status}</span>
                    </td>
                    <td className="px-4 py-3 font-medium">GH₵ {Number(b.service.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Verifications */}
        {tab === "verifications" && (
          <div className="space-y-4">
            {verifications.length === 0 && (
              <p className="text-center py-16 text-gray-400">No verification requests.</p>
            )}
            {verifications.map((v) => (
              <div key={v.id} className="bg-white border rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{v.provider.user.fullName}</p>
                    <p className="text-gray-500 text-sm">ID Type: {v.idType} · {v.idNumber}</p>
                    {v.smileidSummary && <p className="text-green-600 text-xs mt-1">✓ {v.smileidSummary}</p>}
                    {v.documentPath && (
                      <a href={v.documentPath} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs mt-1 block hover:underline">
                        View document
                      </a>
                    )}
                    <p className="text-gray-400 text-xs mt-1">{new Date(v.createdAt).toLocaleDateString("en-GH")}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    v.status === "approved" ? "bg-green-100 text-green-700" :
                    v.status === "rejected" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>{v.status}</span>
                </div>
                {v.status === "pending" && (
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <button
                      onClick={() => adminAction("approve_verification", v.id)}
                      disabled={loadingId === `approve_verification-${v.id}`}
                      className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => adminAction("reject_verification", v.id)}
                      disabled={loadingId === `reject_verification-${v.id}`}
                      className="bg-red-100 text-red-700 text-sm px-4 py-2 rounded-lg hover:bg-red-200 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Feedback */}
        {tab === "feedback" && (
          <div className="space-y-4">
            {feedback.map((f) => (
              <div key={f.id} className={`bg-white border rounded-xl p-5 ${!f.isRead ? "border-blue-200" : ""}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{f.user.fullName}</p>
                    <p className="text-yellow-500 text-sm">{"★".repeat(f.rating)}</p>
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
                    <input
                      value={replyText[f.id] ?? ""}
                      onChange={(e) => setReplyText({ ...replyText, [f.id]: e.target.value })}
                      placeholder="Write a reply…"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => adminAction("reply_feedback", f.id, { reply: replyText[f.id] })}
                      disabled={!replyText[f.id] || loadingId === `reply_feedback-${f.id}`}
                      className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Reply
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Providers */}
        {tab === "providers" && (
          <div className="bg-white border rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["#","Name","Email","Category","Rating","Verified","Featured"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">{p.id}</td>
                    <td className="px-4 py-3 font-medium">{p.user.fullName}</td>
                    <td className="px-4 py-3 text-gray-500">{p.user.email}</td>
                    <td className="px-4 py-3 text-gray-500">{p.serviceCategory}</td>
                    <td className="px-4 py-3">★ {Number(p.rating).toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.isVerified ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.isVerified ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.isFeatured ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.isFeatured ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
