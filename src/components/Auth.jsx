
import { useState } from "react";

const API_URL = "http://localhost:3000";

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "login" : "register";

      const response = await fetch(
        `${API_URL}/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(
            isLogin
              ? { email, password }
              : { fullName, email, password }
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      setMessage(data.message);

      
if (data.user) {
  onLogin(data.user);

  if (data.user.role === "admin") {
    window.location.assign("/admin");
  }
}

    } catch (error) {
      setMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to the server. Make sure your backend is running."
          : error.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="auth"
      className="bg-black px-6 py-20 text-white md:px-12"
    >
      <div className="mx-auto max-w-md">
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.3em] text-red-500">
          Pulse Fitness
        </p>

        <h2 className="mb-3 text-center text-3xl font-black uppercase md:text-4xl">
          {isLogin ? "Welcome Back" : "Join the Movement"}
        </h2>

        <p className="mb-8 text-center text-sm text-gray-400">
          {isLogin
            ? "Log in to your account."
            : "Create your account and start your fitness journey."}
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-white/10 bg-zinc-950 p-6 md:p-8"
        >
          {!isLogin && (
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-semibold"
              >
                Full name
              </label>

              <input
                id="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
                placeholder="Your full name"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
              placeholder="At least 8 characters"
            />
          </div>

          {message && (
            <p
              role="status"
              aria-live="polite"
              className="rounded-lg bg-white/5 p-3 text-sm text-gray-200"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-red-600 px-5 py-3 font-bold uppercase tracking-wide transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : isLogin
                ? "Log In"
                : "Create Account"}
          </button>

          <p className="text-center text-sm text-gray-400">
            {isLogin ? "New to Pulse Fitness?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage("");
              }}
              className="font-bold text-red-500 hover:text-red-400"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </form>
      </div>
    </section>
  );
}

export default Auth;
