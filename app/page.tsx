import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  let featured: any[] = [];
  let categories: any[] = [];

  try {
    [featured, categories] = await Promise.all([
      prisma.serviceProvider.findMany({
        where: { isFeatured: true, isVerified: true },
        include: { user: { select: { fullName: true } } },
        orderBy: { rating: "desc" },
        take: 6,
      }),
      prisma.homepageCategory.findMany({
        where: { isVisible: true },
        orderBy: { displayOrder: "asc" },
      }),
    ]);
  } catch {
    // DB not yet connected — show static shell
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Quick<span className="text-gray-900">Hire</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/categories" className="text-gray-600 hover:text-gray-900 text-sm">Services</Link>
            {session ? (
              <>
                {(session.user as any).userType === "admin" && (
                  <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">Admin</Link>
                )}
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
                <Link href="/api/auth/signout" className="text-sm text-gray-600 hover:text-gray-900">Logout</Link>
              </>
            ) : (
              <>
                <Link href="/auth" className="text-sm text-gray-600 hover:text-gray-900">Login</Link>
                <Link href="/auth?tab=register" className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-wide mb-3">
              The service marketplace
            </p>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-4">
              Find &amp; Hire{" "}
              <em className="text-blue-600 not-italic">Professionals</em> in Minutes
            </h1>
            <p className="text-gray-500 text-lg mb-8">
              Search for plumbers, tutors, technicians and more — trusted, vetted, ready to help.
            </p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-8 border">
            <p className="font-semibold text-gray-700 mb-4">What do you need done?</p>
            <form action="/categories" className="flex gap-2">
              <input
                name="q"
                placeholder="e.g. Plumber, Math Tutor, Electrician…"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="bg-blue-600 py-3">
        <div className="max-w-6xl mx-auto px-4 flex gap-6 overflow-x-auto text-white text-sm font-medium">
          <span className="whitespace-nowrap opacity-70">Popular →</span>
          {["Plumbing","Electrical","Tutoring","Cleaning","Carpentry","Catering","Interior Design","Security","Painting"].map((s) => (
            <span key={s} className="whitespace-nowrap">{s}</span>
          ))}
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Popular Services</h2>
            <span className="text-gray-500 text-sm">{categories.length} categories</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories?category=${encodeURIComponent(cat.filterKey)}`}
                className="bg-white rounded-xl p-6 border hover:border-blue-300 hover:shadow-md transition group"
              >
                <span className="text-3xl">{cat.icon}</span>
                <h3 className="font-semibold text-gray-900 mt-3 group-hover:text-blue-600">{cat.name}</h3>
                <p className="text-gray-500 text-sm mt-1">{cat.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured providers */}
      {featured.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Featured Professionals</h2>
              <Link href="/categories" className="text-blue-600 text-sm hover:underline">View all →</Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((p) => {
                const initials = p.user.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase();
                return (
                  <Link
                    key={p.id}
                    href={`/providers/${p.id}`}
                    className="border rounded-xl p-6 hover:shadow-lg transition"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg">
                        {initials}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{p.user.fullName}</p>
                        <p className="text-gray-500 text-sm">{p.serviceCategory}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="text-yellow-500">★</span>
                      <span className="font-medium text-gray-900">{Number(p.rating).toFixed(1)}</span>
                      <span>·</span>
                      <span>{p.experienceYears} yrs exp</span>
                    </div>
                    {p.bio && <p className="text-gray-500 text-sm mt-3 line-clamp-2">{p.bio}</p>}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">How QuickHire Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "1", title: "Search", desc: "Browse verified professionals in your area by category or service." },
            { step: "2", title: "Book", desc: "Choose a provider, pick a date and time that works for you." },
            { step: "3", title: "Pay", desc: "Pay securely via Mobile Money, card, or cash after service is done." },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-white font-bold text-lg mb-2">QuickHire</p>
          <p className="text-sm">Ghana's trusted service marketplace. Find &amp; hire professionals fast.</p>
          <p className="text-xs mt-6">© {new Date().getFullYear()} QuickHire. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
