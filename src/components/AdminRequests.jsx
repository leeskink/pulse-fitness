
import { useCallback, useEffect, useState } from "react";

const API = "http://localhost:3000/api";

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}

const fmtDate = (value) =>
  new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString(
    undefined,
    { weekday: "long", day: "numeric", month: "short", year: "numeric" }
  );

const fmtTime = (value) => String(value || "").slice(0, 5);

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [edits, setEdits] = useState({});

  const load = useCallback(async () => {
    const [me, result] = await Promise.all([
      api("/auth/me"),
      api("/admin/requests"),
    ]);
    if (me.user.role !== "admin") {
      window.location.assign("/");
      return;
    }
    setRequests(result.requests || []);
    setEdits((current) => {
      const next = { ...current };
      for (const r of result.requests || []) {
        if (!next[r.id]) {
          next[r.id] = {
            sessionDate: String(r.requested_date).slice(0, 10),
            startTime: fmtTime(r.requested_time),
            adminMessage: "",
          };
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [load]);

  async function updateRequest(id, action) {
    setBusyId(id);
    setError("");
    setNotice("");
    try {
      const edit = edits[id];
      const result = await api(`/admin/requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action, ...edit }),
      });
      setNotice(result.message || "Request updated.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    window.location.assign("/");
  }

  const pending = requests.filter((r) => r.status === "pending");
  const other = requests.filter((r) => r.status !== "pending");

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#08090b] text-white">
        Loading booking requests...
      </main>
    );
  }

  function RequestCard({ request }) {
    const edit = edits[request.id] || {};
    const setEdit = (key, value) =>
      setEdits((current) => ({
        ...current,
        [request.id]: { ...current[request.id], [key]: value },
      }));

    return (
      <article className="rounded-xl border border-white/10 bg-[#111318] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400">
              {request.program_name}
            </p>
            <h3 className="mt-2 text-xl font-black">{request.member_name}</h3>
            <p className="mt-1 text-xs text-zinc-500">{request.member_email}</p>
          </div>
          <span className="border border-amber-500/30 px-3 py-1 text-[9px] font-black uppercase text-amber-300">
            {request.status}
          </span>
        </div>

        <div className="mt-5 grid gap-3 border-y border-white/10 py-4 text-sm sm:grid-cols-2">
          <p><span className="text-zinc-500">Trainer:</span> {request.trainer_name}</p>
          <p><span className="text-zinc-500">Duration:</span> {request.duration_minutes} minutes</p>
          <p><span className="text-zinc-500">Requested:</span> {fmtDate(request.requested_date)}</p>
          <p><span className="text-zinc-500">Time:</span> {fmtTime(request.requested_time)}</p>
        </div>

        {request.notes && (
          <p className="mt-4 text-sm leading-6 text-zinc-400">
            Member notes: {request.notes}
          </p>
        )}

        {request.status === "pending" && (
          <div className="mt-5 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Approve at requested time or change to reschedule
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-zinc-400">
                Confirmed date
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={edit.sessionDate || ""}
                  onChange={(e) => setEdit("sessionDate", e.target.value)}
                  className="mt-2 w-full border border-white/10 bg-black px-3 py-3 text-sm text-white"
                />
              </label>
              <label className="text-xs font-bold text-zinc-400">
                Confirmed time
                <input
                  type="time"
                  value={edit.startTime || ""}
                  onChange={(e) => setEdit("startTime", e.target.value)}
                  className="mt-2 w-full border border-white/10 bg-black px-3 py-3 text-sm text-white"
                />
              </label>
            </div>
            <label className="block text-xs font-bold text-zinc-400">
              Message to member
              <textarea
                rows="2"
                value={edit.adminMessage || ""}
                onChange={(e) => setEdit("adminMessage", e.target.value)}
                placeholder="Optional update for the member..."
                className="mt-2 w-full border border-white/10 bg-black px-3 py-3 text-sm text-white"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                disabled={busyId === request.id}
                onClick={() => updateRequest(request.id, "approve")}
                className="bg-emerald-600 px-5 py-3 text-xs font-black uppercase tracking-widest hover:bg-emerald-500 disabled:opacity-50"
              >
                {busyId === request.id ? "SAVING..." : "Approve"}
              </button>
              <button
                disabled={busyId === request.id}
                onClick={() => updateRequest(request.id, "reschedule")}
                className="border border-blue-500/50 px-5 py-3 text-xs font-black uppercase tracking-widest text-blue-300 hover:bg-blue-500/10 disabled:opacity-50"
              >
                Reschedule
              </button>
              <button
                disabled={busyId === request.id}
                onClick={() => updateRequest(request.id, "decline")}
                className="border border-red-500/40 px-5 py-3 text-xs font-black uppercase tracking-widest text-red-300 hover:bg-red-500/10 disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {request.status !== "pending" && (
          <div className="mt-4 text-sm text-zinc-400">
            <p>
              Admin update: {request.admin_message || "No additional message."}
            </p>
            {request.confirmed_date && (
              <p className="mt-2 text-zinc-300">
                Scheduled: {fmtDate(request.confirmed_date)} at{" "}
                {fmtTime(request.confirmed_time)}
              </p>
            )}
          </div>
        )}
      </article>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090b] text-white">
      <header className="border-b border-white/10 bg-[#090a0c]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <a href="/admin" className="text-xl font-black">
            PULSE<span className="text-red-500">.</span>FITNESS
            <span className="ml-3 text-[9px] uppercase tracking-widest text-zinc-500">
              Admin / Bookings
            </span>
          </a>
          <div className="flex gap-3">
            <a href="/admin" className="border border-white/15 px-4 py-2 text-xs font-bold">
              ADMIN HOME
            </a>
            <button onClick={logout} className="border border-white/15 px-4 py-2 text-xs font-bold">
              LOG OUT
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <p className="text-[10px] font-black uppercase tracking-[.3em] text-red-500">
          Member management
        </p>
        <h1 className="mt-3 text-4xl font-black sm:text-5xl">
          Training requests<span className="text-red-500">.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
          Review member requests, confirm the requested time, or reschedule the
          session. Approved sessions automatically appear in the member portal.
        </p>

        {error && <p className="mt-6 border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}
        {notice && <p className="mt-6 border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">{notice}</p>}

        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black">Pending requests</h2>
            <span className="border border-amber-500/30 px-3 py-2 text-xs font-black text-amber-300">
              {pending.length} TO REVIEW
            </span>
          </div>
          {pending.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {pending.map((r) => <RequestCard key={r.id} request={r} />)}
            </div>
          ) : (
            <div className="border border-dashed border-white/15 p-8 text-center text-sm text-zinc-500">
              No pending requests. You're all caught up.
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-black">Previous decisions</h2>
          {other.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {other.map((r) => <RequestCard key={r.id} request={r} />)}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No decisions have been made yet.</p>
          )}
        </section>

        <button
          onClick={() => load().catch((e) => setError(e.message))}
          className="mt-8 border border-white/20 px-5 py-3 text-xs font-black uppercase tracking-widest hover:border-red-500"
        >
          Refresh requests
        </button>
      </div>
    </main>
  );
}
