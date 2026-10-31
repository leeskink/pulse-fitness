import { useCallback, useEffect, useMemo, useState } from "react";

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: "include", ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status}).`);
  return data;
}
const time = (value) => String(value || "").slice(0,5);
const date = (value) => new Date(`${String(value).slice(0,10)}T12:00:00`).toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long",year:"numeric"});

export default function MemberDashboard() {
  const [user,setUser] = useState(null);
  const [trainers,setTrainers] = useState([]);
  const [sessions,setSessions] = useState([]);
  const [saved,setSaved] = useState(false);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [form,setForm] = useState({preferredTrainerId:"",preferredDays:[],preferredTime:"flexible",trainingGoal:""});

  const load = useCallback(async () => {
    const [me,t,p,s] = await Promise.all([
      api("/auth/me"),api("/member/trainers"),api("/member/preferences"),api("/member/sessions")
    ]);
    if (me.user.role !== "member") { window.location.assign(me.user.role === "admin" ? "/admin" : "/"); return; }
    setUser(me.user); setTrainers(t.trainers || []); setSessions(s.sessions || []);
    if (p.preferences) {
      const pref=p.preferences;
      setForm({
        preferredTrainerId:pref.preferred_trainer_id ? String(pref.preferred_trainer_id) : "",
        preferredDays:(pref.preferred_days || []).map(Number),
        preferredTime:pref.preferred_time || "flexible",
        trainingGoal:pref.training_goal || "",
      });
      setSaved(true);
    }
  },[]);

  useEffect(() => { load().catch((e)=>setError(e.message)).finally(()=>setLoading(false)); },[load]);

  const selectedTrainer = useMemo(()=>trainers.find(t=>String(t.id)===String(form.preferredTrainerId)),[trainers,form.preferredTrainerId]);
  const upcoming = sessions.filter(s=>s.status==="scheduled" && String(s.session_date).slice(0,10)>=new Date().toISOString().slice(0,10));

  function toggleDay(day) {
    setForm(current=>({...current,preferredDays:current.preferredDays.includes(day)
      ? current.preferredDays.filter(d=>d!==day) : [...current.preferredDays,day].sort((a,b)=>a-b)}));
  }

  async function save(event) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const result=await api("/member/preferences",{method:"PUT",body:JSON.stringify(form)});
      setSaved(true); setNotice(result.message || "Preferences saved.");
    } catch(e) { setError(e.message); } finally { setSaving(false); }
  }

  async function logout() { await api("/auth/logout",{method:"POST"}); window.location.assign("/"); }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#08090b] text-white">Loading member portal…</main>;

  return <main className="min-h-screen bg-[#08090b] text-white">
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090a0c]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <a href="/" className="text-xl font-black">PULSE<span className="text-red-500">.</span>FITNESS <span className="ml-2 text-[9px] uppercase tracking-widest text-zinc-500">Member portal</span></a>
        <div className="flex items-center gap-4"><span className="hidden text-sm text-zinc-400 sm:inline">{user?.fullName}</span><button onClick={logout} className="border border-white/15 px-4 py-2 text-xs font-bold">LOG OUT</button></div>
      </div>
    </header>
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <div><p className="text-[10px] font-black uppercase tracking-[.3em] text-red-500">Your training starts here</p><h1 className="mt-3 text-4xl font-black sm:text-5xl">Welcome, {user?.fullName?.split(" ")[0]}.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">Choose your preferred coach and training days. Your sessions are confirmed only after the admin assigns dates and times.</p></div>
        <div className="border border-white/10 bg-[#141619] px-5 py-4"><p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Upcoming confirmed sessions</p><p className="mt-1 text-3xl font-black">{upcoming.length}</p></div>
      </div>
      {error && <p role="alert" className="mb-5 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      {notice && <p role="status" className="mb-5 border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{notice}</p>}
      <div className="grid gap-7 xl:grid-cols-[1.1fr_.9fr]">
        <section className="border border-white/10 bg-[#111318] p-5 sm:p-7">
          <p className="text-[10px] font-black uppercase tracking-[.25em] text-red-500">01 / Your preferences</p><h2 className="mt-2 text-2xl font-black">Choose your trainer</h2><p className="mt-2 text-sm text-zinc-400">Choose a preferred coach. This is a request, not a confirmed booking.</p>
          <form onSubmit={save} className="mt-6 space-y-7">
            <div className="grid gap-4 sm:grid-cols-2">
              {trainers.map(trainer=>{
                const active=String(form.preferredTrainerId)===String(trainer.id);
                return <button type="button" key={trainer.id} onClick={()=>setForm(f=>({...f,preferredTrainerId:String(trainer.id)}))} className={`relative border p-4 text-left ${active?"border-red-500 bg-red-500/10":"border-white/10 bg-black/20 hover:border-white/30"}`}>
                  {trainer.photo_data?<img src={trainer.photo_data} alt={trainer.full_name} className="mb-4 h-40 w-full object-cover"/>:<div className="mb-4 grid h-40 place-items-center bg-zinc-800 text-4xl font-black text-red-400">{trainer.full_name?.[0]}</div>}
                  <h3 className="font-black">{trainer.full_name}</h3><p className="mt-1 text-xs font-bold text-red-400">{trainer.specialty || "Fitness coach"}</p><p className="mt-3 min-h-12 text-xs leading-6 text-zinc-400">{trainer.bio}</p>
                  <p className="mt-3 border-t border-white/10 pt-3 text-[9px] font-black uppercase tracking-widest text-zinc-500">Weekly availability</p>
                  <div className="mt-2 flex flex-wrap gap-1">{(trainer.availability||[]).map((slot,i)=><span key={i} className="border border-white/10 px-2 py-1 text-[9px] text-zinc-300">{DAYS[slot.dayOfWeek]} {time(slot.startTime)}–{time(slot.endTime)}</span>)}</div>
                  <span className={`absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full border text-xs ${active?"border-red-500 bg-red-500 text-white":"border-white/40 text-transparent"}`}>✓</span>
                </button>;
              })}
            </div>
            {!trainers.length && <p className="border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">No active trainers are available yet. Please check back after the gym team adds its coaches.</p>}
            <div><p className="mb-3 text-sm font-bold">Preferred training days</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{DAYS.map((day,index)=><button type="button" key={day} onClick={()=>toggleDay(index)} className={`border px-3 py-3 text-xs font-bold ${form.preferredDays.includes(index)?"border-red-500 bg-red-600":"border-white/10 bg-black/20 text-zinc-400 hover:border-white/30"}`}>{day}</button>)}</div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-xs font-bold text-zinc-300">Preferred time<select value={form.preferredTime} onChange={e=>setForm(f=>({...f,preferredTime:e.target.value}))} className="w-full border border-white/10 bg-black px-4 py-3 text-sm"><option value="flexible">Flexible</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select></label>
              <label className="space-y-2 text-xs font-bold text-zinc-300">Main fitness goal<input value={form.trainingGoal} onChange={e=>setForm(f=>({...f,trainingGoal:e.target.value}))} maxLength={1000} placeholder="e.g. Build strength" className="w-full border border-white/10 bg-black px-4 py-3 text-sm"/></label>
            </div>
            <button disabled={saving || !trainers.length} className="w-full bg-red-600 px-6 py-4 text-xs font-black uppercase tracking-widest hover:bg-red-500 disabled:opacity-50">{saving?"SAVING…":saved?"UPDATE MY PREFERENCES":"SUBMIT MY PREFERENCES"} ↗</button>
            <p className="text-[10px] leading-6 text-zinc-500">Your preferences help the team plan your sessions. They do not reserve a trainer or a time slot.</p>
          </form>
        </section>
        <aside className="space-y-6">
          <section className="border border-white/10 bg-[#111318] p-5 sm:p-7"><p className="text-[10px] font-black uppercase tracking-[.25em] text-red-500">02 / Request status</p><h2 className="mt-2 text-2xl font-black">Your training request</h2>
            {saved?<div className="mt-5 space-y-4"><div><p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Preferred trainer</p><p className="mt-1 font-bold">{selectedTrainer?.full_name || "Not selected"}</p></div><div><p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Preferred days</p><p className="mt-1 text-sm text-zinc-300">{form.preferredDays.map(d=>DAYS[d]).join(", ")}</p></div><div><p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Preferred time</p><p className="mt-1 text-sm capitalize text-zinc-300">{form.preferredTime}</p></div><div className="border border-amber-500/20 bg-amber-500/5 p-4"><p className="text-xs font-black uppercase tracking-widest text-amber-300">Awaiting admin assignment</p><p className="mt-2 text-xs leading-6 text-zinc-400">Your preferences have been saved. Confirmed bookings will appear below after the admin assigns them.</p></div></div>:<p className="mt-4 text-sm leading-7 text-zinc-400">Select a trainer and at least one preferred day, then submit your request.</p>}
          </section>
          <section className="border border-white/10 bg-[#111318] p-5 sm:p-7"><div className="flex items-end justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.25em] text-red-500">03 / Confirmed bookings</p><h2 className="mt-2 text-2xl font-black">My schedule</h2></div><span className="text-2xl font-black">{sessions.length}</span></div>
            {sessions.length?<div className="mt-5 space-y-3">{sessions.map(s=><article key={s.id} className="border border-white/10 bg-black/20 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold">{date(s.session_date)}</p><span className={`border px-3 py-1 text-[9px] font-black uppercase ${s.status==="scheduled"?"border-emerald-500/30 text-emerald-300":s.status==="completed"?"border-blue-500/30 text-blue-300":"border-red-500/30 text-red-300"}`}>{s.status}</span></div><p className="mt-2 text-sm text-zinc-300">{time(s.start_time)} – {time(s.end_time)}</p><div className="mt-3 border-t border-white/10 pt-3"><p className="text-sm font-bold">{s.trainer_name}</p><p className="text-[10px] text-zinc-500">{s.trainer_specialty}</p></div>{s.notes&&<p className="mt-3 text-xs text-zinc-400">{s.notes}</p>}</article>)}</div>:<div className="mt-5 border border-dashed border-white/15 p-6 text-center"><p className="text-sm font-bold">No sessions assigned yet</p><p className="mt-2 text-xs leading-6 text-zinc-500">Your confirmed dates and times will appear here once the admin schedules you.</p></div>}
            <button onClick={()=>load().catch(e=>setError(e.message))} className="mt-5 w-full border border-white/15 px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:border-red-500">Refresh my schedule</button>
          </section>
        </aside>
      </div>
    </div>
  </main>;
}
