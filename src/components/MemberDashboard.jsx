
import { useCallback, useEffect, useMemo, useState } from "react";
import { programs } from "../data/programs";

const API = "/api";

const money = (value) =>
  new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const dateLabel = (value) =>
  new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString(
    undefined,
    { weekday: "short", day: "numeric", month: "short", year: "numeric" }
  );

const timeLabel = (value) => String(value || "").slice(0, 5);

const addMinutes = (time, minutes) => {
  const [hours, mins] = time.split(":").map(Number);
  const total = hours * 60 + mins + Number(minutes);
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

async function api(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API}${path}`, {
      credentials: "include",
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Cannot connect to Pulse Fitness. Check that the backend is running on port 3000."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status}).`);
  }

  return data;
}

const initialForm = {
  trainerId: "",
  programName: "",
  sessionDate: "",
  startTime: "",
  duration: "60",
  notes: "",
};

const plansFallback = [
  {
    id: "starter",
    name: "Starter",
    description: "A flexible starting point for your fitness journey.",
    price: 199,
    duration_days: 30,
    features: ["Gym floor access", "Locker room access", "Fitness assessment"],
  },
  {
    id: "performance",
    name: "Performance",
    description: "For members ready to take their training further.",
    price: 349,
    duration_days: 30,
    features: [
      "Full gym access",
      "Group fitness classes",
      "Monthly progress review",
      "Personal training consultation",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    description: "A premium experience with personalized support.",
    price: 599,
    duration_days: 30,
    features: [
      "Full gym and class access",
      "Two personal training sessions",
      "Priority class booking",
      "Monthly progress review",
    ],
  },
];

function SectionHeading({ number, label, title }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-black uppercase tracking-[.25em] text-red-500">
        {number} / {label}
      </p>
      <h2 className="mt-2 text-2xl font-black sm:text-3xl">{title}</h2>
    </div>
  );
}

export default function MemberDashboard() {
  const [user, setUser] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payingPlan, setPayingPlan] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(initialForm);

  const load = useCallback(async () => {
    setError("");

    const me = await api("/auth/me");

    if (me.user.role !== "member") {
      window.location.assign(me.user.role === "admin" ? "/admin" : "/");
      return;
    }

    setUser(me.user);

    const results = await Promise.allSettled([
      api("/member/trainers"),
      api("/member/requests"),
      api("/member/sessions"),
      api("/membership-plans"),
      api("/orders"),
    ]);

    const [trainerResult, requestResult, sessionResult, planResult, orderResult] =
      results;

    const failures = [];

    if (trainerResult.status === "fulfilled") {
      setTrainers(trainerResult.value.trainers || []);
    } else {
      failures.push(`Trainers: ${trainerResult.reason.message}`);
    }

    if (requestResult.status === "fulfilled") {
      setRequests(requestResult.value.requests || []);
    } else {
      failures.push(`Requests: ${requestResult.reason.message}`);
    }

    if (sessionResult.status === "fulfilled") {
      setSessions(sessionResult.value.sessions || []);
    } else {
      failures.push(`Sessions: ${sessionResult.reason.message}`);
    }

    if (planResult.status === "fulfilled") {
      setPlans(planResult.value.plans || []);
    } else {
      setPlans(plansFallback);
      failures.push(`Membership plans: ${planResult.reason.message}`);
    }

    if (orderResult.status === "fulfilled") {
      setOrders(orderResult.value.orders || []);
    } else {
      failures.push(`Payment history: ${orderResult.reason.message}`);
    }

    if (failures.length) {
      setError(failures.join(" | "));
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("payment") === "success") {
      setNotice(
        "Thank you! Stripe has returned you to Pulse Fitness. Your payment confirmation will appear in your order history once verified."
      );
      window.history.replaceState({}, "", "/member");
    } else if (params.get("payment") === "cancelled") {
      setNotice("Your checkout was cancelled. You can choose a membership whenever you're ready.");
      window.history.replaceState({}, "", "/member");
    }

    load()
      .catch((e) => {
        setError(e.message);
        if (e.message.includes("Please log in")) {
          window.location.assign("/");
        }
      })
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

  async function chooseMembership(plan) {
    setPayingPlan(plan.name);
    setError("");
    setNotice("");

    try {
      const result = await api("/checkout/create-session", {
        method: "POST",
        body: JSON.stringify({ planName: plan.name }),
      });

      if (!result.url) {
        throw new Error("Stripe did not return a checkout URL.");
      }

      window.location.assign(result.url);
    } catch (e) {
      setError(e.message);
      setPayingPlan("");
    }
  }

  async function refreshDashboard() {
    try {
      await load();
      setNotice("Your dashboard has been refreshed.");
    } catch (e) {
      setError(e.message);
    }
  }

  async function submitRequest(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const endTime = addMinutes(form.startTime, form.duration);

      if (endTime <= form.startTime) {
        throw new Error("The selected session time is invalid.");
      }

      const result = await api("/member/requests", {
        method: "POST",
        body: JSON.stringify({
          trainerId: form.trainerId,
          programName: form.programName,
          sessionDate: form.sessionDate,
          startTime: form.startTime,
          endTime,
          notes: form.notes,
        }),
      });

      setNotice(result.message || "Your training request has been submitted.");
      setForm(initialForm);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/");
    }
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
              Welcome, {user?.fullName?.split(" ")[0] || "Member"}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
              Manage your membership, meet your coaches, choose a programme
              and request the training time that works for you.
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
          <div
            role="alert"
            className="mb-5 border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-5 border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
          >
            {notice}
          </div>
        )}

        <section className="mb-12">
          <SectionHeading
            number="01"
            label="Membership"
            title="Choose your membership."
          />

          <p className="mb-6 max-w-2xl text-sm leading-6 text-zinc-400">
            Choose the membership that fits your goals. Select a plan to
            continue to secure Stripe Checkout.
          </p>

          <div className="grid gap-5 md:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={`relative flex flex-col border bg-[#111318] p-6 ${
                  plan.name === "Performance"
                    ? "border-red-500"
                    : "border-white/10"
                }`}
              >
                {plan.name === "Performance" && (
                  <span className="absolute right-4 top-4 bg-red-600 px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                    Popular
                  </span>
                )}

                <p className="text-xs font-black uppercase tracking-widest text-red-400">
                  {plan.name}
                </p>

                <p className="mt-4 text-4xl font-black">
                  {money(plan.price)}
                  <span className="ml-1 text-sm font-medium text-zinc-500">
                    / {Number(plan.duration_days || 30)} days
                  </span>
                </p>

                <p className="mt-4 min-h-12 text-sm leading-6 text-zinc-400">
                  {plan.description}
                </p>

                <div className="my-6 h-px bg-white/10" />

                <ul className="mb-7 flex-1 space-y-3 text-sm text-zinc-300">
                  {(plan.features || [
                    "Gym access",
                    "Member portal access",
                    "Fitness support",
                  ]).map((feature, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-red-500">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => chooseMembership(plan)}
                  disabled={Boolean(payingPlan)}
                  className="w-full bg-red-600 px-5 py-4 text-xs font-black uppercase tracking-widest transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {payingPlan === plan.name
                    ? "CONNECTING TO STRIPE..."
                    : "CHOOSE MEMBERSHIP ↗"}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <SectionHeading
            number="02"
            label="Payment history"
            title="Your payments."
          />

          {orders.length ? (
            <div className="overflow-x-auto border border-white/10">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-[#17191e] text-[10px] uppercase tracking-widest text-zinc-500">
                  <tr>
                    <th className="p-4">Membership</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t border-white/10">
                      <td className="p-4 font-bold">{order.plan_name}</td>
                      <td className="p-4">
                        {money(Number(order.amount_cents) / 100)}
                      </td>
                      <td className="p-4 text-zinc-400">
                        {dateLabel(order.created_at)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-3 py-1 text-[10px] font-black uppercase ${
                            order.status === "paid"
                              ? "bg-emerald-500/10 text-emerald-300"
                              : order.status === "pending"
                                ? "bg-amber-500/10 text-amber-300"
                                : "bg-red-500/10 text-red-300"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-white/10 bg-[#111318] p-6 text-sm text-zinc-400">
              You have no payments yet. Your membership purchases will appear
              here.
            </div>
          )}

          <button
            onClick={refreshDashboard}
            className="mt-4 border border-white/15 px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:border-red-500"
          >
            Refresh payment history
          </button>
        </section>

        <section className="mb-12">
          <SectionHeading
            number="03"
            label="Your coaching team"
            title="Meet your trainers."
          />

          {trainers.length === 0 ? (
            <div className="border border-white/10 bg-[#111318] p-6 text-sm text-zinc-400">
              No active trainers have been added yet. Please check back soon.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {trainers.map((trainer) => (
                <article
                  key={trainer.id}
                  className="overflow-hidden rounded-xl border border-white/10 bg-[#111318]"
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

        <div className="grid gap-7 xl:grid-cols-2">
          <section className="rounded-xl border border-white/10 bg-[#111318] p-5 sm:p-7">
            <SectionHeading
              number="04"
              label="Request a session"
              title="Build your next session."
            />

            <p className="text-sm leading-6 text-zinc-400">
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
              <SectionHeading
                number="05"
                label="Your week"
                title="Upcoming schedule."
              />

              <p className="text-sm text-zinc-400">
                Your confirmed sessions for this week.
              </p>

              {thisWeek.length ? (
                <div className="mt-5 space-y-3">
                  {thisWeek.map((s) => (
                    <article
                      key={s.id}
                      className="border border-white/10 bg-black/30 p-4"
                    >
                      <p className="font-bold">{dateLabel(s.session_date)}</p>
                      <p className="mt-2 text-sm text-zinc-300">
                        {timeLabel(s.start_time)} – {timeLabel(s.end_time)}
                      </p>
                      <p className="mt-2 font-bold">
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
                  <p className="text-sm font-bold">
                    No confirmed sessions this week
                  </p>
                  <p className="mt-2 text-xs leading-6 text-zinc-500">
                    Once your request is approved, your sessions will appear here.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-white/10 bg-[#111318] p-5 sm:p-7">
              <SectionHeading
                number="06"
                label="Booking updates"
                title="My requests."
              />

              {requests.length ? (
                <div className="space-y-3">
                  {requests.map((r) => (
                    <article
                      key={r.id}
                      className="border border-white/10 bg-black/30 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold">{r.program_name}</p>
                        <span className="border border-white/15 px-3 py-1 text-[9px] font-black uppercase">
                          {r.status}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-zinc-400">
                        Coach: {r.trainer_name}
                      </p>
                      <p className="mt-1 text-xs text-zinc-300">
                        Requested: {dateLabel(r.requested_date)} at{" "}
                        {timeLabel(r.requested_start_time)}
                      </p>
                      {r.admin_note && (
                        <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-6 text-zinc-300">
                          Team update: {r.admin_note}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">
                  You haven't submitted a training request yet.
                </p>
              )}
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
