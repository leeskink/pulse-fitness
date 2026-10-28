
import { useEffect, useState } from "react";

const API_URL = "http://localhost:3000/api";

function Icon({ name, size = 20 }) {
  const paths = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    activity: (
      <polyline points="3 12 7 12 10 4 14 20 17 12 21 12" />
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-2 .8l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-2-.8l-1.7.7-1.4-2.4 1.4-1.1a8 8 0 0 1 0-2.2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 2-.8l.3-1.8h2.8l.3 1.8a8 8 0 0 1 2 .8l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1 0 2.1Z" transform="translate(-1 -1) scale(1.08)" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    arrow: <polyline points="7 17 17 7 7 7" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function StatCard({ label, value, description, icon, accent }) {
  return (
    <article className="group rounded-2xl border border-white/[0.08] bg-[#111214] p-5 transition duration-200 hover:border-white/20 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-400">{label}</p>
          <p className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {value ?? "—"}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${accent}`}>
          <Icon name={icon} size={21} />
        </div>
      </div>

      <p className="mt-4 text-xs text-zinc-500">{description}</p>
    </article>
  );
}

function AdminDashboard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadOverview() {
    const response = await fetch(`${API_URL}/admin/overview`, {
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to load the admin dashboard."
      );
    }

    setOverview(data);
  }

  useEffect(() => {
    async function checkAdminSession() {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          await loadOverview();
        }
      } catch (err) {
        setError(err.message || "Could not connect to the API.");
      } finally {
        setLoading(false);
      }
    }

    checkAdminSession();
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      setUser(data.user);
      setPassword("");
      await loadOverview();
    } catch (err) {
      setOverview(null);
      setError(err.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
      setOverview(null);
      setPassword("");
      setError("");
      window.location.assign("/");
    }
  }

  const recentUsers = (overview?.recentUsers || []).filter((member) => {
    const term = search.trim().toLowerCase();

    return (
      (member.full_name || "").toLowerCase().includes(term) ||
      (member.email || "").toLowerCase().includes(term) ||
      (member.role || "").toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090a0c] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-red-500" />
          <p className="mt-5 text-sm text-zinc-400">
            Loading your dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (!overview) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090a0c] px-5 py-12 text-white">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111214] p-7 shadow-2xl sm:p-9"
        >
          <a href="/" className="text-xl font-black tracking-tight">
            PULSE<span className="text-red-500">.</span> FITNESS
          </a>

          <p className="mt-10 text-xs font-bold uppercase tracking-[0.22em] text-red-400">
            Secure administrator access
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Welcome back.
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Sign in to manage your fitness platform.
          </p>

          {error && (
            <p
              role="alert"
              className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <label
            htmlFor="admin-email"
            className="mt-7 block text-sm font-medium text-zinc-300"
          >
            Email address
          </label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-red-500"
            placeholder="admin@example.com"
          />

          <label
            htmlFor="admin-password"
            className="mt-5 block text-sm font-medium text-zinc-300"
          >
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-red-500"
            placeholder="Enter your password"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-7 w-full rounded-xl bg-red-600 px-5 py-3.5 font-semibold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sign in to dashboard
          </button>

          <a
            href="/"
            className="mt-6 block text-center text-sm text-zinc-500 transition hover:text-white"
          >
            ← Back to Pulse Fitness
          </a>
        </form>
      </main>
    );
  }

  const firstName = user?.fullName?.split(" ")[0] || "Admin";

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#090a0c] text-zinc-100">
  <div className="flex min-h-screen w-full">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col overflow-hidden border-r border-white/[0.07] bg-[#0d0e10] lg:flex">
          <a href="/" className="flex items-center gap-3 px-6 py-7">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-lg font-black">
              P
            </span>
            <span className="text-lg font-black tracking-tight">
              PULSE<span className="text-red-500">.</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                Fitness management
              </span>
            </span>
          </a>

          <div className="px-4 pt-7">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
              Workspace
            </p>

            <nav className="mt-4 space-y-1">
              <a
                href="#overview"
                className="flex items-center gap-3 rounded-xl bg-red-500/10 px-3 py-3 text-sm font-semibold text-red-400"
              >
                <Icon name="dashboard" />
                Dashboard
              </a>
              <a
                href="#members"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
              >
                <Icon name="users" />
                Recent members
              </a>
              <a
                href="/"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
              >
                <Icon name="activity" />
                View website
                <span className="ml-auto text-zinc-600">↗</span>
              </a>
            </nav>
          </div>

          <div className="mt-auto p-4">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-xs font-semibold text-zinc-300">
                Pulse Fitness Admin
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Manage your platform from one place.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <Icon name="logout" />
              Log out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <header className="sticky top-0 z-10 border-b border-white/[0.07] bg-[#090a0c]/95 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 font-black lg:hidden">
                  P
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Admin workspace
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Pulse Fitness / Overview
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-white">
                    {user?.fullName || "Administrator"}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Administrator
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-sm font-bold text-red-400">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  aria-label="Log out"
                  title="Log out"
                  className="rounded-lg border border-white/10 p-2.5 text-zinc-400 transition hover:border-red-500/40 hover:text-red-400 lg:hidden"
                >
                  <Icon name="logout" size={18} />
                </button>
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1500px] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 xl:px-12">
            <section id="overview">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
                      Management overview
                    </p>
                  </div>
                  <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Good to see you, {firstName}
                    <span className="text-red-500">.</span>
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                    Here’s what’s happening with your Pulse Fitness platform.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start rounded-xl border border-white/[0.08] bg-[#111214] px-4 py-3 text-xs text-zinc-400 sm:self-auto">
                  <Icon name="calendar" size={16} />
                  {new Date().toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard
                  label="Total accounts"
                  value={overview.totalUsers}
                  description="All registered accounts"
                  icon="users"
                  accent="bg-red-500/10 text-red-400"
                />
                <StatCard
                  label="Members"
                  value={overview.totalMembers}
                  description="Accounts with the member role"
                  icon="activity"
                  accent="bg-emerald-500/10 text-emerald-400"
                />
                <StatCard
                  label="Recent registrations"
                  value={overview.recentUsers?.length ?? 0}
                  description="Latest five accounts from your API"
                  icon="arrow"
                  accent="bg-sky-500/10 text-sky-400"
                />
              </div>
            </section>

            <section
              id="members"
              className="mt-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111214]"
            >
              <div className="flex flex-col gap-2 border-t border-white/[0.07] px-5 py-4 text-xs leading-5 text-zinc-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Recent registrations
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    The latest accounts created on your platform
                  </p>
                </div>

                <label className="relative block w-full sm:max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                    <Icon name="search" size={17} />
                  </span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search name, email, role..."
                    aria-label="Search recent registrations"
                    className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500/60"
                  />
                </label>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-white/[0.02] text-[11px] uppercase tracking-[0.13em] text-zinc-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Member</th>
                      <th className="px-6 py-4 font-semibold">Email address</th>
                      <th className="px-6 py-4 font-semibold">Role</th>
                      <th className="px-6 py-4 font-semibold">Date joined</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentUsers.map((member) => (
                      <tr
                        key={member.id}
                        className="border-t border-white/[0.06] transition hover:bg-white/[0.02]"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">
                              {(member.full_name || "?")
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <span className="font-medium text-zinc-200">
                              {member.full_name || "Unnamed user"}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-zinc-400">
                          {member.email}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                              member.role === "admin"
                                ? "bg-red-500/10 text-red-400"
                                : "bg-emerald-500/10 text-emerald-400"
                            }`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {member.role || "member"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-zinc-500">
                          {member.created_at
                            ? new Date(member.created_at).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}

                    {recentUsers.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center text-sm text-zinc-500"
                        >
                          No matching registrations found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2 border-t border-white/[0.07] px-6 py-4 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Showing {recentUsers.length} of{" "}
                  {overview.recentUsers?.length ?? 0} recent accounts
                </span>
                <span>Data provided by your Pulse Fitness API</span>
              </div>
            </section>

            <footer className="mt-8 flex flex-col gap-2 border-t border-white/[0.06] pt-5 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
              <span>© {new Date().getFullYear()} Pulse Fitness</span>
              <span>Administrator workspace</span>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AdminDashboard;
