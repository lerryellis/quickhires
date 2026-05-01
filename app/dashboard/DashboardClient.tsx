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
  const [bookingError, setBookingError] = useState<string | null>(null);

  const isProvider = userType === "provider" || userType === "both";
  const isCustomer = userType === "customer" || userType === "both";

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "profile", label: "My Profile" },
    ...(isCustomer ? [{ key: "my_bookings", label: "My Bookings" }] : []),
    ...(isProvider ? [{ key: "manage_bookings", label: "Manage Bookings" }] : []),
    ...(isProvider ? [{ key: "services", label: "My Services" }] : []),
    ...(isProvider ? [{ key: "provider_profile", label: "Provider Settings" }] : []),
    ...(isProvider && commissions.length > 0 ? [{ key: "commissions", label: "Commissions" }] : []),
    ...(isProvider ? [{ key: "verify", label: "Verification" }] : []),
    ...(isProvider ? [{ key: "featured", label: "Get Featured" }] : []),
    { key: "notifications", label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
  ];

  async function updateBooking(bookingId: number, status: string) {
    setLoadingId(bookingId);
    setBookingError(null);
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setBookingError(data.error ?? "Failed to update booking.");
    }
    setLoadingId(null);
    if (res.ok) router.refresh();
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

        {/* Profile */}
        {tab === "profile" && (
          <ProfileTab user={user} />
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

                  {b.payment?.paymentStatus === "completed" && (
                    <div className="mt-3 pt-3 border-t flex gap-2 flex-wrap">
                      <Link href={`/receipt/${b.id}`} className="text-sm text-blue-600 hover:underline">View Receipt</Link>
                      <Link href={`/invoice/${b.id}`} className="text-sm text-blue-600 hover:underline">Invoice</Link>
                    </div>
                  )}

                  {b.status === "completed" && b.payment?.paymentStatus !== "completed" && (
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
            {bookingError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {bookingError}
              </div>
            )}
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
                      <button onClick={() => updateBooking(b.id, "accepted")} disabled={loadingId === b.id}
                        className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
                        Accept
                      </button>
                      <button onClick={() => updateBooking(b.id, "cancelled")} disabled={loadingId === b.id}
                        className="bg-red-100 text-red-700 text-sm px-4 py-2 rounded-lg hover:bg-red-200 disabled:opacity-50">
                        Decline
                      </button>
                    </div>
                  )}
                  {b.status === "accepted" && (
                    <div className="mt-4 pt-4 border-t">
                      <button onClick={() => updateBooking(b.id, "completed")} disabled={loadingId === b.id}
                        className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        Mark as Completed
                      </button>
                    </div>
                  )}
                  {b.payment?.paymentStatus === "completed" && (
                    <div className="mt-3 pt-3 border-t flex gap-2">
                      <Link href={`/receipt/${b.id}`} className="text-sm text-blue-600 hover:underline">Receipt</Link>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Services */}
        {tab === "services" && provider && (
          <ServicesTab providerId={provider.id} services={provider.services} />
        )}

        {/* Provider Settings */}
        {tab === "provider_profile" && provider && (
          <ProviderProfileTab provider={provider} />
        )}

        {/* Commissions */}
        {tab === "commissions" && (
          <CommissionsTab commissions={commissions} />
        )}

        {/* Verification */}
        {tab === "verify" && provider && (
          <VerificationTab provider={provider} />
        )}

        {/* Get Featured */}
        {tab === "featured" && provider && (
          <FeaturedTab provider={provider} />
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
                  <div key={n.id} className={`bg-white border rounded-xl p-4 ${!n.isRead ? "border-blue-200 bg-blue-50" : ""}`}>
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

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({ user }: { user: any }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  async function saveProfile() {
    setLoading(true); setMsg("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, phone }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setMsg(res.ok ? "Profile updated." : data.error ?? "Failed.");
    if (res.ok) router.refresh();
  }

  async function changePassword() {
    setPwLoading(true); setPwMsg("");
    const res = await fetch("/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setPwLoading(false);
    setPwMsg(res.ok ? "Password changed." : data.error ?? "Failed.");
    if (res.ok) { setCurrentPassword(""); setNewPassword(""); }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Personal Information</h2>
        {msg && <p className={`text-sm ${msg.includes("updated") ? "text-green-600" : "text-red-600"}`}>{msg}</p>}
        <div>
          <label className="block text-sm text-gray-500 mb-1">Full Name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={saveProfile} disabled={loading} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Saving…" : "Save Changes"}
        </button>
      </div>

      <div className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Change Password</h2>
        {pwMsg && <p className={`text-sm ${pwMsg.includes("changed") ? "text-green-600" : "text-red-600"}`}>{pwMsg}</p>}
        <div>
          <label className="block text-sm text-gray-500 mb-1">Current Password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={changePassword} disabled={pwLoading} className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50">
          {pwLoading ? "Changing…" : "Change Password"}
        </button>
      </div>
    </div>
  );
}

// ── Services Tab ──────────────────────────────────────────────────────────────
function ServicesTab({ providerId, services: initialServices }: { providerId: number; services: any[] }) {
  const router = useRouter();
  const [services, setServices] = useState(initialServices);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrice, setEditPrice] = useState("");

  async function addService() {
    setLoading(true);
    setAddError(null);
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceName: name, description: desc, price, duration }),
    });
    const s = await res.json().catch(() => ({}));
    if (res.ok) { setServices((p) => [s, ...p]); setName(""); setDesc(""); setPrice(""); setDuration(""); setAdding(false); }
    else { setAddError(s.error ?? "Failed to add service."); }
    setLoading(false);
  }

  async function deleteService(id: number) {
    await fetch(`/api/services/${id}`, { method: "DELETE" });
    setServices((p) => p.filter((s) => s.id !== id));
  }

  async function saveEdit(id: number) {
    const res = await fetch(`/api/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceName: editName, description: editDesc, price: editPrice }),
    });
    const s = await res.json().catch(() => ({}));
    if (res.ok) { setServices((p) => p.map((x) => (x.id === id ? s : x))); setEditId(null); }
  }

  async function toggleActive(id: number, current: boolean) {
    const res = await fetch(`/api/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    const s = await res.json().catch(() => ({}));
    if (res.ok) setServices((p) => p.map((x) => (x.id === id ? s : x)));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-900">My Services</h2>
        <button onClick={() => setAdding(!adding)} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
          + Add Service
        </button>
      </div>

      {adding && (
        <div className="bg-white border rounded-xl p-5 space-y-3">
          {addError && <p className="text-red-600 text-sm">{addError}</p>}
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Service name *" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price (GH₵) *" type="number" min="0" step="0.01" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duration (mins)" type="number" min="1" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={addService} disabled={loading || !name.trim() || !price}
              className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
              {loading ? "Adding…" : "Add"}
            </button>
            <button onClick={() => setAdding(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">Cancel</button>
          </div>
        </div>
      )}

      {services.length === 0 && !adding && (
        <p className="text-center py-16 text-gray-400">No services yet. Add your first service above.</p>
      )}

      {services.map((s: any) => (
        <div key={s.id} className={`bg-white border rounded-xl p-5 ${!s.isActive ? "opacity-60" : ""}`}>
          {editId === s.id ? (
            <div className="space-y-3">
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} type="number" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40" />
              <div className="flex gap-2">
                <button onClick={() => saveEdit(s.id)} className="bg-blue-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-blue-700">Save</button>
                <button onClick={() => setEditId(null)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{s.serviceName}</p>
                {s.description && <p className="text-gray-500 text-sm mt-1">{s.description}</p>}
                {s.duration && <p className="text-gray-400 text-xs mt-1">{s.duration} min</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-blue-600 font-semibold">GH₵ {Number(s.price).toFixed(2)}</span>
                <button onClick={() => { setEditId(s.id); setEditName(s.serviceName); setEditDesc(s.description ?? ""); setEditPrice(String(Number(s.price))); }}
                  className="text-xs text-gray-500 hover:text-gray-700 border rounded px-2 py-1">Edit</button>
                <button onClick={() => toggleActive(s.id, s.isActive)}
                  className={`text-xs border rounded px-2 py-1 ${s.isActive ? "text-yellow-600 hover:text-yellow-700" : "text-green-600 hover:text-green-700"}`}>
                  {s.isActive ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => deleteService(s.id)} className="text-xs text-red-500 hover:text-red-700 border rounded px-2 py-1">Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Provider Profile Tab ──────────────────────────────────────────────────────
function ProviderProfileTab({ provider }: { provider: any }) {
  const router = useRouter();
  const [bio, setBio] = useState(provider?.bio ?? "");
  const [category, setCategory] = useState(provider?.serviceCategory ?? "");
  const [experience, setExperience] = useState(String(provider?.experienceYears ?? 0));
  const [availability, setAvailability] = useState(provider?.availability ?? "");
  const [languages, setLanguages] = useState(provider?.languages ?? "English");
  const [avgResponse, setAvgResponse] = useState(provider?.avgResponse ?? "");
  const [isAvailable, setIsAvailable] = useState(provider?.isAvailable ?? true);
  const [dailyCap, setDailyCap] = useState(String(provider?.dailyBookingCap ?? 0));
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setLoading(true); setMsg("");
    const res = await fetch("/api/provider-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio, serviceCategory: category, experienceYears: experience, availability, languages, avgResponse, isAvailable, dailyBookingCap: dailyCap }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setMsg(res.ok ? "Profile updated." : data.error ?? "Failed.");
    if (res.ok) router.refresh();
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Provider Settings</h2>
        {msg && <p className={`text-sm ${msg.includes("updated") ? "text-green-600" : "text-red-600"}`}>{msg}</p>}

        <div>
          <label className="block text-sm text-gray-500 mb-1">Service Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Years Experience</label>
            <input value={experience} onChange={(e) => setExperience(e.target.value)} type="number" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Daily Booking Cap (0 = unlimited)</label>
            <input value={dailyCap} onChange={(e) => setDailyCap(e.target.value)} type="number" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">Availability</label>
          <input value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="e.g. Mon–Fri, 8am–6pm" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">Languages</label>
          <input value={languages} onChange={(e) => setLanguages(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">Average Response Time</label>
          <input value={avgResponse} onChange={(e) => setAvgResponse(e.target.value)} placeholder="e.g. Within 1 hour" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="avail" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} className="rounded" />
          <label htmlFor="avail" className="text-sm text-gray-700">Currently available for bookings</label>
        </div>
        <button onClick={save} disabled={loading} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

// ── Commissions Tab ───────────────────────────────────────────────────────────
function CommissionsTab({ commissions }: { commissions: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<number | null>(null);
  const [refs, setRefs] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});

  async function pay(id: number) {
    setLoading(id);
    setErrors((e) => ({ ...e, [id]: "" }));
    const res = await fetch("/api/commissions/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commissionId: id, paymentReference: refs[id] ?? "" }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrors((e) => ({ ...e, [id]: data.error ?? "Payment failed." }));
    }
    setLoading(null);
    if (res.ok) router.refresh();
  }

  const total = commissions.reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="font-semibold text-red-700">Total Commission Owed: GH₵ {total.toFixed(2)}</p>
        <p className="text-red-600 text-sm mt-1">This is the 10% platform commission for cash bookings. Please pay promptly to keep your account in good standing.</p>
      </div>
      {commissions.map((c) => (
        <div key={c.id} className="bg-white border rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-gray-900">{c.booking?.service?.serviceName ?? `Booking #${c.bookingId}`}</p>
              <p className="text-gray-500 text-sm">Commission: GH₵ {Number(c.amount).toFixed(2)}</p>
              <p className="text-gray-400 text-xs">{new Date(c.createdAt).toLocaleDateString("en-GH", { timeZone: "Africa/Accra" })}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t space-y-2">
            {errors[c.id] && <p className="text-red-600 text-sm">{errors[c.id]}</p>}
            <div className="flex gap-2 items-center">
              <input
                value={refs[c.id] ?? ""}
                onChange={(e) => setRefs((r) => ({ ...r, [c.id]: e.target.value }))}
                placeholder="Payment reference (optional)"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1"
              />
              <button type="button" onClick={() => pay(c.id)} disabled={loading === c.id}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading === c.id ? "Processing…" : "Mark as Paid"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Verification Tab ──────────────────────────────────────────────────────────
function VerificationTab({ provider }: { provider: any }) {
  const router = useRouter();
  const [idType, setIdType] = useState("Ghana Card");
  const [idNumber, setIdNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  if (provider?.isVerified) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 max-w-lg">
        <p className="font-semibold text-green-700 text-lg">✓ Your account is verified</p>
        <p className="text-green-600 text-sm mt-2">Your identity has been confirmed. This badge builds trust with customers.</p>
      </div>
    );
  }

  async function submit() {
    setLoading(true); setMsg("");
    const res = await fetch("/api/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idType, idNumber, notes }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setMsg(res.ok ? "Verification request submitted. We'll review within 1–2 business days." : data.error ?? "Failed.");
    if (res.ok) router.refresh();
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">ID Verification</h2>
        <p className="text-gray-500 text-sm">Submit your government-issued ID to get a verified badge on your profile. Verified providers get more bookings.</p>
        {msg && <p className={`text-sm ${msg.includes("submitted") ? "text-green-600" : "text-red-600"}`}>{msg}</p>}

        <div>
          <label className="block text-sm text-gray-500 mb-1">ID Type</label>
          <select value={idType} onChange={(e) => setIdType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option>Ghana Card</option>
            <option>Passport</option>
            <option>Voter ID</option>
            <option>Driver's License</option>
            <option>SSNIT Card</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">ID Number</label>
          <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="Enter your ID number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">Additional Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button onClick={submit} disabled={loading || !idNumber.trim()}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Submitting…" : "Submit for Verification"}
        </button>
      </div>
    </div>
  );
}

// ── Featured Tab ──────────────────────────────────────────────────────────────
function FeaturedTab({ provider }: { provider: any }) {
  const router = useRouter();
  const [days, setDays] = useState("7");
  const [method, setMethod] = useState("mobile_money");
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const weeks = Math.ceil(parseInt(days) / 7);
  const fee = weeks * 50;

  if (provider?.isFeatured) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-lg">
        <p className="font-semibold text-yellow-700 text-lg">★ You are a featured provider</p>
        <p className="text-yellow-600 text-sm mt-2">Your profile appears at the top of search results and on the homepage.</p>
      </div>
    );
  }

  async function request() {
    setLoading(true); setMsg("");
    const res = await fetch("/api/featured", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationDays: days, paymentMethod: method, paymentReference: ref }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setMsg(res.ok ? "Request submitted! We'll activate your featured listing after payment confirmation." : data.error ?? "Failed.");
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Get Featured</h2>
        <p className="text-gray-500 text-sm">Featured providers appear at the top of search results and on the homepage, getting significantly more bookings.</p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
          GH₵ 50 per week · Minimum 1 week
        </div>
        {msg && <p className={`text-sm ${msg.includes("submitted") ? "text-green-600" : "text-red-600"}`}>{msg}</p>}

        <div>
          <label className="block text-sm text-gray-500 mb-1">Duration</label>
          <select value={days} onChange={(e) => setDays(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="7">1 week — GH₵ 50</option>
            <option value="14">2 weeks — GH₵ 100</option>
            <option value="30">30 days — GH₵ 250</option>
            <option value="90">90 days — GH₵ 650</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">Payment Method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="mobile_money">Mobile Money</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash (at office)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">Payment Reference / Transaction ID</label>
          <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Enter your payment reference" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <p className="text-sm font-medium text-gray-900">Total: GH₵ {fee}</p>
        <button onClick={request} disabled={loading}
          className="bg-yellow-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50">
          {loading ? "Submitting…" : "Request Featured Listing"}
        </button>
      </div>
    </div>
  );
}

// ── Payment Widget ────────────────────────────────────────────────────────────
function PaymentWidget({ bookingId }: { bookingId: number }) {
  const router = useRouter();
  const [method, setMethod] = useState("mobile_money");
  const [network, setNetwork] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, paymentMethod: method, mobileNetwork: network, mobilePhone: phone }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Payment failed. Please try again.");
    }
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Make Payment</p>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={method} onChange={(e) => setMethod(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="mobile_money">Mobile Money</option>
          <option value="card">Card</option>
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select>
        {method === "mobile_money" && (
          <>
            <select value={network} onChange={(e) => setNetwork(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Network</option>
              <option value="MTN">MTN</option>
              <option value="Vodafone">Vodafone</option>
              <option value="AirtelTigo">AirtelTigo</option>
            </select>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="MoMo number" className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36" />
          </>
        )}
        <button onClick={pay} disabled={loading} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
          {loading ? "Processing…" : "Pay Now"}
        </button>
      </div>
    </div>
  );
}

// ── Review Widget ─────────────────────────────────────────────────────────────
function ReviewWidget({ bookingId, providerId }: { bookingId: number; providerId: number }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, providerId, rating, comment }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to submit review.");
    }
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Leave a review</p>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} onClick={() => setRating(s)} className={s <= rating ? "text-yellow-500 text-xl" : "text-gray-300 text-xl"}>★</button>
        ))}
      </div>
      <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience…" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      <button onClick={submit} disabled={loading} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Submitting…" : "Submit Review"}
      </button>
    </div>
  );
}
