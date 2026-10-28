
import { useEffect, useState } from "react";

const API_URL = "http://localhost:3000/api";

function StatCard({ label, value, description }) {
  return (
    <article className="rounded-xl border border-white/10 bg-zinc-900 p-6">
      <p className="text-sm font-medium text-zinc-400">{label}</p>
      <p className="mt-4 text-4xl font-black text-white">
        {value ?? "—"}
      </p>
      <p className="mt-2 text-xs text-zinc-500">{description}</p>
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

      // The backend verifies administrator permissions.
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
    }
  }

  const recentUsers = (overview?.recentUsers || []).filter((member) => {
    const term = search.toLowerCase();

    return (
      (member.full_name || "").toLowerCase().includes(term) ||
      (member.email || "").toLowerCase().includes(term) ||
      (member.role || "").toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090b] text-white">
        <p className="text-sm text-zinc-400">Loading Pulse Fitness Admin…</p>
      </main>
    );
  }

  if (!overview) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090b] px-5 py-12 text-white">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-8 shadow-2xl"
        >
          <a href="/" className="text-xl font-black tracking-tight">
            PULSE<span className="text-red-500">.</span> FITNESS
          </a>

          <p className="mt-10 text-xs font-bold uppercase tracking-[0.25em] text-red-500">
            Administrator access
          </p>

          <h1 className="mt-3 text-3xl font-black">Welcome back.</h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Sign in with your administrator account to access the dashboard.
          </p>

          {error && (
            <p role="alert" className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <label htmlFor="admin-email" className="mt-7 block text-sm font-semibold">
            Email address
          </label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
            placeholder="admin@example.com"
          />

          <label htmlFor="admin-password" className="mt-5 block text-sm font-semibold">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
            placeholder="Enter your password"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-7 w-full rounded-lg bg-red-600 px-5 py-3 font-bold transition hover:bg-red-500 disabled:opacity-50"
          >
            Sign in to dashboard
          </button>

          <a href="/" className="mt-6 block text-center text-sm text-zinc-400 hover:text-white">
            ← Back to Pulse Fitness
          </a>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090b] text-white">
      <header className="border-b border-white/10 bg-zinc-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <a href="/" className="text-xl font-black">
            PULSE<span className="text-red-500">.</span> FITNESS
            <span className="ml-3 hidden text-xs font-semibold uppercase tracking-widest text-zinc-500 sm:inline">
              Admin
            </span>
          </a>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold transition hover:border-red-500 hover:text-red-400"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-500">
            Management overview
          </p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            Dashboard<span className="text-red-500">.</span>
          </h1>
          <p className="mt-3 text-sm text-zinc-400">
            Welcome, {user?.fullName || "Administrator"}. Here's your membership overview.
          </p>
        </div>

        {error && (
          <p role="alert" className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </p>
        )}

        <section aria-label="Membership statistics" className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total registered users"
            value={overview.totalUsers}
            description="All registered accounts"
          />
          <StatCard
            label="Member accounts"
            value={overview.totalMembers}
            description="Accounts with the member role"
          />
          <StatCard
            label="Recent registrations"
            value={overview.recentUsers?.length ?? 0}
            description="Latest five accounts returned by the API"
          />
        </section>

        <section className="mt-10 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/70">
          <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-xl font-bold">Recent registrations</h2>
              <p className="mt-1 text-sm text-zinc-400">
                The latest accounts from your database
              </p>
            </div>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search recent users..."
              aria-label="Search recent users"
              className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-red-500 sm:max-w-xs"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-5 py-4 font-semibold">Name</th>
                  <th className="px-5 py-4 font-semibold">Email</th>
                  <th className="px-5 py-4 font-semibold">Role</th>
                  <th className="px-5 py-4 font-semibold">Registered</th>
                </tr>
              </thead>

              <tbody>
                {recentUsers.map((member) => (
                  <tr key={member.id} className="border-t border-white/10 hover:bg-white/[0.02]">
                    <td className="px-5 py-4 font-semibold">{member.full_name}</td>
                    <td className="px-5 py-4 text-zinc-400">{member.email}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        member.role === "admin"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-white/10 text-zinc-300"
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-zinc-400">
                      {member.created_at
                        ? new Date(member.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}

                {recentUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-zinc-400">
                      No matching recent registrations.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-6 text-xs leading-6 text-zinc-500">
          Dashboard data is loaded from the Pulse Fitness API. Administrator permissions are verified by the backend.
        </p>
      </div>
    </main>
  );
}

export default AdminDashboard;
