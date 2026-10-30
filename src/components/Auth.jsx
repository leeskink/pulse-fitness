import { useState } from "react";

export default function Auth({ onLogin }) {
  const [isLogin,setIsLogin]=useState(true);
  const [fullName,setFullName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);

  async function submit(e){
    e.preventDefault();setLoading(true);setMessage("");
    try{
      const response=await fetch(`/api/auth/${isLogin?"login":"register"}`,{
        method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},
        body:JSON.stringify(isLogin?{email,password}:{fullName,email,password})
      });
      const raw=await response.text();let data={};
      try{data=raw?JSON.parse(raw):{};}catch{throw new Error(`Unexpected server response (${response.status}).`);}
      if(!response.ok)throw new Error(data.message||"Authentication failed.");
      if(data.user){
        onLogin?.(data.user);
        window.location.assign(data.user.role==="admin"?"/admin":"/");
      }else setMessage(data.message||"Account updated.");
    }catch(err){setMessage(err.message||"Could not connect to the server.");}
    finally{setLoading(false);}
  }
  return <section id="auth" className="bg-black px-6 py-20 text-white md:px-12"><div className="mx-auto max-w-md">
    <p className="mb-3 text-center text-xs font-bold uppercase tracking-[.3em] text-red-500">Pulse Fitness</p>
    <h2 className="mb-3 text-center text-3xl font-black uppercase">{isLogin?"Welcome Back":"Join the Movement"}</h2>
    <p className="mb-8 text-center text-sm text-gray-400">{isLogin?"Log in to your account.":"Create your member account and start your fitness journey."}</p>
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-white/10 bg-zinc-950 p-6 md:p-8">
      {!isLogin&&<div><label htmlFor="auth-name" className="mb-2 block text-sm font-semibold">Full name</label><input id="auth-name" required autoComplete="name" value={fullName} onChange={e=>setFullName(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 outline-none focus:border-red-500"/></div>}
      <div><label htmlFor="auth-email" className="mb-2 block text-sm font-semibold">Email address</label><input id="auth-email" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 outline-none focus:border-red-500"/></div>
      <div><label htmlFor="auth-password" className="mb-2 block text-sm font-semibold">Password</label><input id="auth-password" type="password" required minLength={8} autoComplete={isLogin?"current-password":"new-password"} value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 outline-none focus:border-red-500"/></div>
      {message&&<p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-200">{message}</p>}
      <button disabled={loading} className="w-full rounded-lg bg-red-600 px-5 py-3 font-bold uppercase tracking-wide hover:bg-red-700 disabled:opacity-60">{loading?"Please wait…":isLogin?"Log In":"Create Account"}</button>
      <p className="text-center text-sm text-gray-400">{isLogin?"New to Pulse Fitness?":"Already have an account?"} <button type="button" onClick={()=>{setIsLogin(!isLogin);setMessage("");}} className="font-bold text-red-500">{isLogin?"Sign up":"Log in"}</button></p>
      {!isLogin&&<p className="text-center text-xs text-zinc-600">New public accounts are member accounts. Admin access is created by an existing administrator.</p>}
    </form></div></section>;
}
