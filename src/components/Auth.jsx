import { useState } from "react";

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const isLogin = mode === "login";

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/auth/${isLogin ? "login" : "register"}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isLogin ? { email, password } : { fullName, email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Authentication failed.");
      if (data.user) {
        onLogin?.(data.user);
        window.location.assign(data.user.role === "admin" ? "/admin" : "/member");
      }
    } catch (error) {
      setMessage(error.message || "Unable to connect to Pulse Fitness.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="auth" className="bg-black px-5 py-20 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-xl">
        <p className="mb-3 text-center text-xs font-black uppercase tracking-[.3em] text-red-500">Member access</p>
        <h2 className="text-center text-3xl font-black uppercase sm:text-4xl">{isLogin ? "Welcome back" : "Join Pulse Fitness"}</h2>
        <p className="mb-8 mt-3 text-center text-sm text-zinc-400">{isLogin ? "Sign in to view your training plan and sessions." : "Create your account and set your training preferences."}</p>
        <div className="overflow-hidden border border-white/10 bg-[#111318]">
          <div className="grid grid-cols-2 border-b border-white/10">
            <button type="button" onClick={() => { setMode("login"); setMessage(""); }} className={`py-4 text-xs font-black tracking-widest ${isLogin ? "border-b-2 border-red-500 text-white" : "text-zinc-500"}`}>SIGN IN</button>
            <button type="button" onClick={() => { setMode("signup"); setMessage(""); }} className={`py-4 text-xs font-black tracking-widest ${!isLogin ? "border-b-2 border-red-500 text-white" : "text-zinc-500"}`}>CREATE ACCOUNT</button>
          </div>
          <form onSubmit={submit} className="space-y-5 p-6 sm:p-8">
            {!isLogin && <label className="block space-y-2 text-sm font-semibold">Full name<input required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-white/10 bg-black px-4 py-3 outline-none focus:border-red-500" placeholder="Your full name" /></label>}
            <label className="block space-y-2 text-sm font-semibold">Email address<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-white/10 bg-black px-4 py-3 outline-none focus:border-red-500" placeholder="you@example.com" /></label>
            <label className="block space-y-2 text-sm font-semibold">Password<input type="password" required minLength={8} autoComplete={isLogin ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-white/10 bg-black px-4 py-3 outline-none focus:border-red-500" placeholder="At least 8 characters" /></label>
            {message && <p role="alert" className="border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{message}</p>}
            <button disabled={loading} className="w-full bg-red-600 px-5 py-4 text-xs font-black uppercase tracking-widest hover:bg-red-500 disabled:opacity-60">{loading ? "PLEASE WAIT…" : isLogin ? "SIGN IN TO YOUR ACCOUNT" : "CREATE MEMBER ACCOUNT"} <span className="ml-2">↗</span></button>
            <p className="text-center text-xs text-zinc-500">{isLogin ? "New to Pulse Fitness?" : "Already a member?"} <button type="button" onClick={() => { setMode(isLogin ? "signup" : "login"); setMessage(""); }} className="font-bold text-red-400">{isLogin ? "Create an account" : "Sign in"}</button></p>
            {!isLogin && <p className="text-center text-[11px] leading-6 text-zinc-600">Public registration creates a member account. Administrator access is created by an existing administrator.</p>}
          </form>
        </div>
      </div>
    </section>
  );
}
