
import { programs } from './data/programs'
import { trainers } from './data/trainers'
import { classes } from './data/classes'
import { memberships } from './data/membership'
import { schedule } from './data/schedule'
import AdminDashboard from "./components/AdminDashboard";



import { useEffect, useState } from 'react'
import Auth from './components/Auth'

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Programs', href: '#programs' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href:"#auth" },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/90 text-white shadow-lg shadow-black/10 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        {/* Logo */}
        <a
          href="#home"
          className="shrink-0 text-xl font-black tracking-tight sm:text-2xl"
          aria-label="Pulse Fitness home"
          onClick={() => setMenuOpen(false)}
        >
          PULSE<span className="text-red-500">.</span>
          <span className="ml-1">FITNESS</span>
        </a>

        {/* Desktop navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-8 md:flex lg:gap-10"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-zinc-300 transition-colors duration-200 hover:text-red-500 focus-visible:text-red-500"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <a
          href="#contact"
          className="hidden items-center gap-2 rounded-sm bg-red-600 px-5 py-3 text-xs font-extrabold uppercase tracking-widest transition duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-500 md:inline-flex"
        >
          Join Now <span aria-hidden="true">↗</span>
        </a>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 items-center justify-center border border-white/15 text-2xl text-white transition hover:border-red-500 hover:text-red-500 md:hidden"
        >
          {menuOpen ? '×' : '☰'}
        </button>
      </div>

      {/* Mobile navigation */}
      {menuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="border-t border-white/10 bg-zinc-950 px-5 py-5 md:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 hover:text-red-500"
              >
                {link.label}
              </a>
            ))}

            <a
              href="#contact"
              onClick={() => setMenuOpen(false)}
              className="mt-3 bg-red-600 px-4 py-3 text-center text-xs font-extrabold uppercase tracking-widest transition hover:bg-red-500"
            >
              Join Now ↗
            </a>
          </div>
        </nav>
      )}
    </header>
  )
}


function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-[620px] items-center overflow-hidden bg-zinc-950 px-6 py-24 text-white md:min-h-[700px] md:px-12 lg:px-20"
    >
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      >
        <source src="/gymvid.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <p className="mb-6 flex items-center gap-3 text-xs font-extrabold uppercase tracking-[0.3em] text-red-400 sm:text-sm">
          <span className="h-px w-10 bg-red-500" />
          Your fitness. Your future.
        </p>

        <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl md:text-8xl">
          BUILT BY
          <br />
          <span className="text-red-500">DISCIPLINE.</span>
          <br />
          DEFINED BY YOU.
        </h1>

        <p className="mt-7 max-w-xl text-base leading-7 text-gray-300 sm:text-lg">
          Train with purpose. Build real strength. Become the strongest
          version of yourself, one workout at a time.
        </p>

        <div className="mt-9 flex flex-wrap gap-4">
          <a
            href="#programs"
            className="rounded-md bg-red-600 px-7 py-4 text-sm font-extrabold uppercase tracking-wide transition hover:bg-red-700"
          >
            Explore Programs <span aria-hidden="true">↗️</span>
          </a>

          <a
            href="#about"
            className="rounded-md border border-white/40 px-7 py-4 text-sm font-bold uppercase tracking-wide transition hover:border-white hover:bg-white/10"
          >
            Discover Pulse
          </a>
        </div>

        <div className="mt-14 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/20 pt-6 text-xs font-bold uppercase tracking-widest text-gray-300">
          <span><span className="mr-2 text-red-500">✦</span> Train with purpose</span>
          <span><span className="mr-2 text-red-500">✦</span> Progress with intent</span>
          <span><span className="mr-2 text-red-500">✦</span> Own your journey</span>
        </div>
      </div>
    </section>
  )
}


function Programs() {
  const programImages = {
    "Strength Training": "/images/strength.jpg",
    "Cardio Fitness": "/images/cardio.jpg",
    "Personal Training": "/images/personal-training.jpg",
  };

  return (
    <section
      id="programs"
      className="bg-[#08090b] px-5 py-20 text-white sm:px-8 sm:py-24 lg:px-12 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-5 md:mb-14 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-red-500">
              Find your strength
            </p>

            <h2 className="text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
              Train your way<span className="text-red-500">.</span>
            </h2>
          </div>

          <p className="max-w-md text-sm leading-7 text-gray-400 sm:text-base">
            Every goal starts with a plan. Discover your training style,
            challenge your limits, and build strength one session at a time.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {programs.map((program, index) => (
            <article
              key={program.id}
              className="group relative isolate flex min-h-[390px] flex-col justify-end overflow-hidden rounded-xl border border-white/10 bg-zinc-900 transition duration-500 hover:-translate-y-2 hover:border-red-500/70 hover:shadow-[0_20px_60px_rgba(255,59,63,0.12)] sm:min-h-[430px]"
            >
              <img
                src={
                  programImages[program.name] ||
                  "/images/strength.jpg"
                }
                alt={program.name}
                className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                loading="lazy"
              />

              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/65 to-black/10" />

              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5 sm:p-6">
                <span className="text-sm font-extrabold tracking-[0.2em] text-red-400">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="rounded-full border border-white/25 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                  {program.category}
                </span>
              </div>

              <div className="p-5 sm:p-7">
                <div className="mb-3 h-1 w-10 rounded-full bg-red-500 transition-all duration-300 group-hover:w-16" />

                <h3 className="mb-3 text-2xl font-black leading-tight sm:text-3xl">
                  {program.name}
                </h3>

                <p className="max-w-sm text-sm leading-6 text-gray-300 sm:text-base">
                  {program.description}
                </p>

                <a
                  href="#contact"
                  className="mt-6 flex items-center justify-between border-t border-white/20 pt-4 text-sm font-bold text-white transition-colors group-hover:text-red-400"
                >
                  Explore program
                  <span
                    className="text-xl transition-transform duration-300 group-hover:translate-x-2"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}



function Trainers() {
  const trainerImages = [
    "/images/trainer-1.jpg",
    "/images/trainer-2.jpg",
    "/images/trainer-3.jpg",
  ]

  return (
    <section
      id="trainers"
      className="bg-[#080808] px-5 py-20 text-white sm:px-8 md:px-12 md:py-28 lg:px-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-5 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.3em] text-red-500">
              Meet your coaches
            </p>

            <h2 className="text-4xl font-black uppercase leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Train with
              <br />
              the best<span className="text-red-500">.</span>
            </h2>
          </div>

          <p className="max-w-md text-sm leading-7 text-gray-400 sm:text-base">
            Meet the coaches behind your progress. Expert guidance,
            purposeful training, and support to help you reach your goals.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trainers.map((trainer, index) => (
            <article
              key={trainer.id}
              className="group overflow-hidden rounded-lg border border-white/10 bg-[#111111] transition duration-300 hover:-translate-y-1 hover:border-red-500/60"
            >
              <div className="relative h-80 overflow-hidden bg-zinc-900 sm:h-96">
                <img
                  src={trainerImages[index % trainerImages.length]}
                  alt={trainer.name}
                  className="h-full w-full object-cover object-center transition duration-700 group-hover:scale-105"
                  onError={(event) => {
                    event.currentTarget.style.display = "none"
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                <span className="absolute left-5 top-5 text-sm font-black tracking-widest text-red-500">
                  0{index + 1}
                </span>

                <div className="absolute inset-x-0 bottom-0 p-6">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-red-400">
                    {trainer.role}
                  </p>

                  <h3 className="text-2xl font-black sm:text-3xl">
                    {trainer.name}
                  </h3>

                  <p className="mt-2 text-sm text-gray-300">
                    {trainer.specialty}
                  </p>
                </div>
              </div>

              <div className="p-6">
                <p className="min-h-20 text-sm leading-7 text-gray-400">
                  {trainer.description}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Experience
                  </span>

                  <span className="text-sm font-bold text-white">
                    {trainer.experience}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}


function Classes() {
  return (
    <section id="classes" className="bg-zinc-950 px-6 py-24 text-white md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.3em] text-red-500">
          Train together
        </p>

        <h2 className="mb-4 text-4xl font-black sm:text-5xl">
          FIND YOUR CLASS<span className="text-red-500">.</span>
        </h2>

        <p className="mb-12 max-w-2xl leading-7 text-gray-400">
          From high-intensity workouts to strength training and recovery,
          find the class that matches your goals.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {classes.map((fitnessClass) => (
            <article
              key={fitnessClass.id}
              className="border border-white/10 bg-zinc-900 p-6 transition hover:-translate-y-1 hover:border-red-500"
            >
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-red-500">
                {fitnessClass.category}
              </p>

              <h3 className="mb-3 text-xl font-extrabold">
                {fitnessClass.name}
              </h3>

              <p className="mb-5 text-sm leading-6 text-gray-400">
                {fitnessClass.description}
              </p>

              <p className="border-t border-white/10 pt-4 text-sm text-gray-300">
                {fitnessClass.duration} minutes
              </p>

              <a
                href="#schedule"
                className="mt-5 inline-block text-sm font-bold text-red-400 hover:text-red-300"
              >
                View schedule →
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}


function Schedule() {
  return (
    <section
      id="schedule"
      className="bg-zinc-950 px-5 py-20 text-white sm:px-8 md:px-12 md:py-24 lg:px-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-5 md:mb-14 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.3em] text-red-500">
              Plan your week
            </p>

            <h2 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
              CLASS SCHEDULE<span className="text-red-500">.</span>
            </h2>

            <p className="mt-4 max-w-xl leading-7 text-zinc-400">
              Make time for yourself. Find your class, meet your trainer,
              and take the next step towards your fitness goals.
            </p>
          </div>

          <div className="border-l-2 border-red-500 pl-4">
            <p className="text-sm font-bold text-white">
              YOUR WEEK. YOUR GOALS.
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Find your next session below.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/70">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-red-600 text-white">
                <tr>
                  <th className="px-5 py-4 font-extrabold uppercase tracking-wider">Day</th>
                  <th className="px-5 py-4 font-extrabold uppercase tracking-wider">Time</th>
                  <th className="px-5 py-4 font-extrabold uppercase tracking-wider">Class</th>
                  <th className="px-5 py-4 font-extrabold uppercase tracking-wider">Trainer</th>
                  <th className="px-5 py-4 font-extrabold uppercase tracking-wider">Duration</th>
                  <th className="px-5 py-4 font-extrabold uppercase tracking-wider">Spots</th>
                </tr>
              </thead>

              <tbody>
                {schedule.map((session, index) => (
                  <tr
                    key={session.id}
                    className={`border-t border-white/10 transition-colors hover:bg-red-500/10 ${
                      index % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
                    }`}
                  >
                    <td className="whitespace-nowrap px-5 py-5 font-bold text-white">
                      {session.day}
                    </td>

                    <td className="whitespace-nowrap px-5 py-5 text-zinc-300">
                      {session.time}
                    </td>

                    <td className="whitespace-nowrap px-5 py-5 font-bold text-white">
                      {session.className}
                    </td>

                    <td className="whitespace-nowrap px-5 py-5 text-zinc-300">
                      {session.trainer}
                    </td>

                    <td className="whitespace-nowrap px-5 py-5 text-zinc-300">
                      {session.duration} min
                    </td>

                    <td className="whitespace-nowrap px-5 py-5">
                      <span className="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
                        {session.spots} spots
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-white/10 px-5 py-4">
            <p className="text-xs leading-5 text-zinc-500">
              Class times and available spots are displayed for planning purposes.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}



function Membership() {
  return (
    <section
      id="membership"
      className="relative overflow-hidden bg-[#08090b] px-5 py-20 text-white sm:px-8 md:px-12 md:py-28 lg:px-20"
    >
      <div className="pointer-events-none absolute left-1/2 top-32 h-72 w-72 -translate-x-1/2 rounded-full bg-red-600/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto mb-14 max-w-3xl text-center md:mb-16">
          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.3em] text-red-500">
            Invest in yourself
          </p>

          <h2 className="text-3xl font-black tracking-tight sm:text-4xl md:text-6xl">
            MEMBERSHIP PLANS<span className="text-red-500">.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
            No shortcuts. No excuses. Choose your plan, commit to your goals,
            and build a stronger version of yourself.
          </p>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3 md:gap-5 xl:gap-7">
          {memberships.map((membership, index) => (
            <article
              key={membership.id}
              className={`relative flex h-full flex-col rounded-2xl border p-6 transition duration-300 hover:-translate-y-2 sm:p-8 ${
                membership.popular
                  ? "border-red-500/80 bg-gradient-to-b from-red-950/50 via-zinc-900 to-zinc-950 shadow-[0_0_45px_rgba(239,68,68,0.12)] md:scale-[1.03] md:py-10"
                  : "border-white/10 bg-zinc-900/60 hover:border-white/25"
              }`}
            >
              {membership.popular && (
                <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Most popular
                </span>
              )}

              {!membership.popular && (
                <p className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Plan 0{index + 1}
                </p>
              )}

              <h3 className="text-2xl font-black sm:text-3xl">
                {membership.name}
              </h3>

              <p className="mt-3 min-h-[3.5rem] text-sm leading-6 text-zinc-400">
                {membership.description}
              </p>

              <div className="mt-7 border-b border-white/10 pb-7">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-sm font-bold text-zinc-400">AED</span>
                  <span className="text-4xl font-black tracking-tight sm:text-5xl">
                    {membership.price}
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  per {membership.period}
                </p>
              </div>

              <div className="mt-7 flex-1">
                <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.18em] text-zinc-300">
                  What's included
                </p>

                <ul className="space-y-4">
                  {membership.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm leading-6 text-zinc-300"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-xs font-black text-red-400">
                        ✓
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href="#contact"
                className={`mt-9 flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 py-4 text-center text-xs font-extrabold uppercase tracking-wider transition duration-300 ${
                  membership.popular
                    ? "bg-red-600 text-white shadow-lg shadow-red-950/40 hover:bg-red-500"
                    : "border border-white/15 bg-white/[0.03] text-white hover:border-red-500 hover:bg-red-500/10 hover:text-red-400"
                }`}
              >
                Choose {membership.name}
                <span aria-hidden="true">→</span>
              </a>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-xs leading-6 text-zinc-500">
          Your goals. Your commitment. Your next level.
        </p>
      </div>
    </section>
  )
}


function About() {
  return (
    <section
      id="about"
      className="relative overflow-hidden border-t border-white/10 bg-[#08090b] px-5 py-20 text-white sm:px-8 md:px-12 md:py-28 lg:px-20"
    >
      <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-red-600/10 blur-[120px]" />

      <div className="relative mx-auto grid max-w-7xl gap-12 md:grid-cols-2 md:items-center md:gap-16">
        <div>
          <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.3em] text-red-500">
            More than a workout
          </p>

          <h2 className="text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            SHOW UP.
            <br />
            PUT IN THE WORK.
            <br />
            <span className="text-red-500">GET STRONGER.</span>
          </h2>

          <div className="mt-8 h-1 w-20 rounded-full bg-red-600" />
        </div>

        <div>
          <p className="text-base leading-8 text-zinc-400 sm:text-lg">
            Real progress comes from consistency, commitment, and the
            willingness to keep going. Pulse Fitness is built around a
            simple idea: every session is an opportunity to improve.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-6 border-t border-white/10 pt-7">
            <div className="pr-3">
              <span className="mb-4 block text-xs font-bold tracking-[0.2em] text-red-500">
                01 / YOUR MINDSET
              </span>
              <h3 className="text-lg font-black sm:text-xl">YOUR GOALS</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                A plan that fits your ambition.
              </p>
            </div>

            <div className="border-l border-white/10 pl-5">
              <span className="mb-4 block text-xs font-bold tracking-[0.2em] text-red-500">
                02 / YOUR JOURNEY
              </span>
              <h3 className="text-lg font-black sm:text-xl">YOUR PACE</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Progress built one session at a time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}



function Contact() {
  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-red-600 px-6 py-20 text-center text-white sm:py-24 md:px-12 md:py-28"
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.3em] text-white/80">
          Your next chapter starts here
        </p>

        <h2 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-7xl">
          READY TO BECOME
          <br />
          STRONGER<span className="text-black">.</span>
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/90 sm:text-lg">
          Take the first step towards your fitness goals.
          Get in touch and start building better habits today.
        </p>

        <a
          href="mailto:info@pulsefitness.com?subject=Pulse%20Fitness%20Membership"
          className="mt-9 inline-flex min-h-14 items-center justify-center gap-3 rounded-md bg-black px-8 py-4 text-sm font-extrabold uppercase tracking-wider text-white transition duration-300 hover:bg-zinc-900 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          Contact Pulse Fitness
          <span aria-hidden="true">↗</span>
        </a>

        <p className="mt-5 text-xs font-medium tracking-wide text-white/70">
          Your goals. Your commitment. Your next level.
        </p>
      </div>
    </section>
  )
}













function Footer() {
  return (
    <footer className="bg-black px-6 py-9 text-white md:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <a href="#home" className="text-xl font-black tracking-wider">
          PULSE<span className="text-red-500">.</span> FITNESS
        </a>

        <p className="text-sm text-gray-400">
          Build your best self. One workout at a time.
        </p>

        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} Pulse Fitness
        </p>
      </div>
    </footer>
  )
}



function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch(
          "http://localhost:3000/api/auth/me",
          { credentials: "include" }
        );

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Could not check login session:", error);
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, []);

  async function handleLogout() {
    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (response.ok) {
        setUser(null);
      }
    } catch (error) {
      console.error("Could not log out:", error);
    }
  }
  if (window.location.pathname === "/admin") {
  return <AdminDashboard />;
}

  return (
    <>
      <Header />

      <main>
        <Hero />
        <Programs />
        <Trainers />
        <Classes />
        <Schedule />
        <Membership />
        <About />
        <Contact />

        <div id="auth">
          {checkingSession ? (
            <p className="bg-black py-10 text-center text-white">
              Checking your account...
            </p>
          ) : user ? (
            <section className="bg-black px-6 py-16 text-center text-white">
              <h2 className="text-3xl font-black">
                Welcome, {user.fullName}!
              </h2>

              <p className="mt-3 text-gray-400">{user.email}</p>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-6 rounded-lg bg-red-600 px-6 py-3 font-bold hover:bg-red-700"
              >
                Log Out
              </button>
            </section>
          ) : (
            <Auth onLogin={setUser} />
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}




export default App