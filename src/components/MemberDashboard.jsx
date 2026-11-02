
import { useCallback, useEffect, useMemo, useState } from "react";
import { programs } from "../data/programs";

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
  if (!response.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

const dateLabel = (value) =>
  new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString(
    undefined,
    { weekday: "short", day: "numeric", month: "short" }
  );

const timeLabel = (value) => String(value || "").slice(0, 5);

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function MemberDashboard() {
  const [user, setUser] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    trainerId: "",
    programName: "",
    sessionDate: "",
    startTime: "",
    duration: "60",
    notes: "",
  });

  const load = useCallback(async () => {
    const [me, trainerData, requestData, sessionData] = await Promise.all([
      api("/auth/me"),
      api("/member/trainers"),
      api("/member/requests"),
      api("/member/sessions"),
    ]);

    if (me.user.role !== "member") {
      window.location.assign(me.user.role === "admin" ? "/admin" : "/");
      return;
    }

    setUser(me.user);
    setTrainers(trainerData.trainers || []);
    setRequests(requestData.requests || []);
    setSessions(sessionData.sessions || []);
  }, []);

  useEffect(() => {
    load()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [load]);

  const upcoming = useMemo(
    () =>
      sessions.filter(
        (s) =>
          s.status === "scheduled" &&
          String(s.session_date).slice(0, 10) >= today()
      ),
    [sessions]
  );

  const thisWeek = useMemo(() => {
    const now = new Date();
    const monday = new Date(now);
    const day = (now.getDay() + 6) % 7;
    monday.setDate(now.getDate() - day);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 7);

    return upcoming.filter((s) => {
      const d = new Date(`${String(s.session_date).slice(0, 10)}T12:00:00`);
      return d >= monday && d < sunday;
    });
  }, [upcoming]);

  async function submitRequest(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const result = await api("/member/requests", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setNotice(result.message || "Your request has been sent to the team.");
      setForm({
        trainerId: "",
        programName: "",
        sessionDate: "",
        startTime: "",
        duration: "60",
        notes: "",
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    window.location.assign("/");
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#08090b] text-white">
        Loading your Pulse member portal...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090b] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090a0c]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="/" className="text-xl font-black tracking-tight">
            PULSE<span className="text-red-500">.</span>FITNESS
            <span className="ml-3 text-[9px] uppercase tracking-[.25em] text-zinc-500">
              Member portal
            </span>
          </a>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-zinc-400 sm:block">
              {user?.fullName}
            </span>
            <button
              onClick={logout}
              className="border border-white/15 px-4 py-2 text-xs font-bold hover:border-red-500"
            >
              LOG OUT
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.3em] text-red-500">
              Your training starts here
            </p>
            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              Welcome, {user?.fullName?.split(" ")[0]}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
              Meet your coaches, choose a programme and request the training
              time that works for you. Your booking is confirmed once approved
              by the Pulse team.
            </p>
          </div>
          <div className="border border-white/10 bg-[#141619] px-6 py-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
              Confirmed this week
            </p>
            <p className="mt-1 text-3xl font-black">{thisWeek.length}</p>
          </div>
        </div>

        {error && (
          <p className="mb-5 border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </p>
        )}
        {notice && (
          <p className="mb-5 border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            {notice}
          </p>
        )}

        <section className="mb-10">
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[.25em] text-red-500">
              01 / Your coaching team
            </p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              Meet your trainers.
            </h2>
          </div>

          {trainers.length === 0 ? (
            <div className="border border-white/10 bg-[#111318] p-6 text-sm text-zinc-400">
              No active trainers have been added yet. Please check back soon.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {trainers.map((trainer) => (
                <article
                  key={trainer.id}
                  className="overflow-hidden rounded-xl border border-white/10 bg-[#111318] transition hover:-translate-y-1 hover:border-red-500/50"
                >
                  {trainer.photo_data ? (
                    <img
                      src={trainer.photo_data}
                      alt={trainer.full_name}
                      className="h-56 w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-56 place-items-center bg-gradient-to-br from-zinc-800 to-black text-6xl font-black text-red-500">
                      {trainer.full_name?.charAt(0)}
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-red-400">
                      {trainer.specialty || "Fitness coach"}
                    </p>
                    <h3 className="mt-2 text-xl font-black">
                      {trainer.full_name}
                    </h3>
                    <p className="mt-3 min-h-12 text-sm leading-6 text-zinc-400">
                      {trainer.bio || "Your Pulse Fitness coaching partner."}
                    </p>
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                        Availability
                      </p>
                      <p className="mt-2 text-xs text-zinc-300">
                        {(trainer.availability || []).length
                          ? trainer.availability
                              .map(
                                (a) =>
                                  `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][a.dayOfWeek]} ${timeLabel(a.startTime)}–${timeLabel(a.endTime)}`
                              )
                              .join(" · ")
                          : "Contact the team for availability"}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-7 xl:grid-cols-[1fr_1fr]">
          <section className="rounded-xl border border-white/10 bg-[#111318] p-5 sm:p-7">
            <p className="text-[10px] font-black uppercase tracking-[.25em] text-red-500">
              02 / Request a session
            </p>
            <h2 className="mt-2 text-2xl font-black">Build your next session.</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Select a programme, coach and preferred time. The admin team will
              approve or suggest a new time.
            </p>

            <form onSubmit={submitRequest} className="mt-6 space-y-5">
              <label className="block text-xs font-bold text-zinc-300">
                Choose a programme
                <select
                  required
                  value={form.programName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, programName: e.target.value }))
                  }
                  className="mt-2 w-full border border-white/10 bg-black px-4 py-3 text-sm text-white"
                >
                  <option value="">Select a programme</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-bold text-zinc-300">
                Preferred trainer
                <select
                  required
                  value={form.trainerId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, trainerId: e.target.value }))
                  }
                  className="mt-2 w-full border border-white/10 bg-black px-4 py-3 text-sm text-white"
                >
                  <option value="">Select a trainer</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} — {t.specialty}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold text-zinc-300">
                  Preferred date
                  <input
                    required
                    type="date"
                    min={today()}
                    value={form.sessionDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sessionDate: e.target.value }))
                    }
                    className="mt-2 w-full border border-white/10 bg-black px-4 py-3 text-sm text-white"
                  />
                </label>
                <label className="block text-xs font-bold text-zinc-300">
                  Preferred start time
                  <input
                    required
                    type="time"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startTime: e.target.value }))
                    }
                    className="mt-2 w-full border border-white/10 bg-black px-4 py-3 text-sm text-white"
                  />
                </label>
              </div>

              <label className="block text-xs font-bold text-zinc-300">
                Session length
                <select
                  value={form.duration}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, duration: e.target.value }))
                  }
                  className="mt-2 w-full border border-white/10 bg-black px-4 py-3 text-sm text-white"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </label>

              <label className="block text-xs font-bold text-zinc-300">
                Notes for your trainer (optional)
                <textarea
                  rows="3"
                  maxLength="1000"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Tell your trainer what you want to focus on..."
                  className="mt-2 w-full resize-y border border-white/10 bg-black px-4 py-3 text-sm text-white"
                />
              </label>

              <button
                disabled={saving || !trainers.length}
                className="w-full bg-red-600 px-6 py-4 text-xs font-black uppercase tracking-widest transition hover:bg-red-500 disabled:opacity-50"
              >
                {saving ? "SENDING REQUEST..." : "REQUEST THIS SESSION ↗"}
              </button>
            </form>
          </section>

          <div className="space-y-7">
            <section className="rounded-xl border border-white/10 bg-[#111318] p-5 sm:p-7">
              <p className="text-[10px] font-black uppercase tracking-[.25em] text-red-500">
                03 / Your week
              </p>
              <h2 className="mt-2 text-2xl font-black">Upcoming schedule.</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Your confirmed sessions for this week.
              </p>

              {thisWeek.length ? (
                <div className="mt-5 space-y-3">
                  {thisWeek.map((s) => (
                    <article
                      key={s.id}
                      className="border border-white/10 bg-black/30 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold">{dateLabel(s.session_date)}</p>
                        <span className="border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[9px] font-black uppercase text-emerald-300">
                          Confirmed
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-zinc-300">
                        {timeLabel(s.start_time)} – {timeLabel(s.end_time)}
                      </p>
                      <p className="mt-2 font-bold text-white">
                        {s.program_name || "Training session"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        Coach: {s.trainer_name}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-5 border border-dashed border-white/15 p-6 text-center">
                  <p className="text-sm font-bold">No confirmed sessions this week</p>
                  <p className="mt-2 text-xs leading-6 text-zinc-500">
                    Once your request is approved, your sessions will appear here.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-white/10 bg-[#111318] p-5 sm:p-7">
              <p className="text-[10px] font-black uppercase tracking-[.25em] text-red-500">
                04 / Booking updates
              </p>
              <h2 className="mt-2 text-2xl font-black">My requests.</h2>

              {requests.length ? (
                <div className="mt-5 space-y-3">
                  {requests.map((r) => (
                    <article
                      key={r.id}
                      className="border border-white/10 bg-black/30 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold">{r.program_name}</p>
                        <span className={`border px-3 py-1 text-[9px] font-black uppercase ${
                          r.status === "approved"
                            ? "border-emerald-500/30 text-emerald-300"
                            : r.status === "rescheduled"
                            ? "border-blue-500/30 text-blue-300"
                            : r.status === "declined"
                            ? "border-red-500/30 text-red-300"
                            : "border-amber-500/30 text-amber-300"
                        }`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-zinc-400">
                        Coach: {r.trainer_name}
                      </p>
                      <p className="mt-1 text-xs text-zinc-300">
                        Requested: {dateLabel(r.requested_date)} at {timeLabel(r.requested_time)}
                      </p>
                      {r.admin_message && (
                        <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-6 text-zinc-300">
                          Team update: {r.admin_message}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-500">
                  You haven't submitted a training request yet.
                </p>
              )}
              <button
                onClick={() => load().catch((e) => setError(e.message))}
                className="mt-5 w-full border border-white/15 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:border-red-500"
              >
                Refresh my dashboard
              </button>
            </section>
          </div>
        </div>

        <footer className="mt-12 border-t border-white/10 py-6 text-center text-[10px] tracking-widest text-zinc-600">
          PULSE FITNESS · TRAIN SMARTER. LIVE STRONGER.
        </footer>
      </div>
    </main>
  );
}
