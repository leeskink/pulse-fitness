
import { programs } from './data/programs'
import { trainers } from './data/trainers'
import { classes } from './data/classes'
import { memberships } from './data/membership'
import { schedule } from './data/schedule'


function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/95 px-6 text-white backdrop-blur-lg md:px-12">
      <div className="mx-auto flex max-w-7xl items-center justify-between py-5">
        <a href="#home" className="text-xl font-black tracking-wider sm:text-2xl">
          PULSE<span className="text-red-500">.</span> FITNESS
        </a>

        <nav className="hidden items-center gap-8 text-sm font-semibold md:flex">
          <a className="transition hover:text-red-500" href="#home">Home</a>
          <a className="transition hover:text-red-500" href="#programs">Programs</a>
          <a className="transition hover:text-red-500" href="#about">About</a>
          <a className="transition hover:text-red-500" href="#contact">Contact</a>
        </nav>

        <a
          href="#contact"
          className="rounded-md bg-red-600 px-4 py-3 text-xs font-extrabold uppercase tracking-wide transition hover:bg-red-700 sm:px-5"
        >
          Join Now <span aria-hidden="true">↗️</span>
        </a>
      </div>
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
  return (
    <section id="programs" className="bg-zinc-950 px-6 py-24 text-white md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.3em] text-red-500">
              Find your strength
            </p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
              TRAIN YOUR WAY<span className="text-red-500">.</span>
            </h2>
          </div>

          <p className="max-w-md leading-7 text-gray-400">
            Every goal starts with a plan. Choose the training approach
            that fits your ambitions and start moving forward.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {programs.map((program, index) => (
            <article
              key={program.id}
              className="group flex min-h-64 flex-col border border-white/10 bg-zinc-900 p-7 transition duration-300 hover:-translate-y-1 hover:border-red-500/70 hover:bg-zinc-900/80 sm:p-8"
            >
              <div className="mb-9 flex items-center justify-between">
                <span className="text-sm font-bold tracking-widest text-red-500">
                  0{index + 1}
                </span>
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-gray-300">
                  {program.category}
                </span>
              </div>

              <h3 className="mb-4 text-2xl font-extrabold">
                {program.name}
              </h3>

              <p className="flex-1 leading-7 text-gray-400">
                {program.description}
              </p>

              <a
                href="#contact"
                className="mt-8 flex items-center justify-between border-t border-white/10 pt-5 text-sm font-bold transition group-hover:text-red-400"
              >
                Find your program
                <span className="text-xl transition group-hover:translate-x-1" aria-hidden="true">→</span>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}


function Trainers() {
  return (
    <section
      id="trainers"
      className="bg-black px-6 py-24 text-white md:px-12 lg:px-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.3em] text-red-500">
            Meet your coaches
          </p>

          <h2 className="text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
            TRAIN WITH THE BEST<span className="text-red-500">.</span>
          </h2>

          <p className="mt-5 max-w-2xl leading-7 text-gray-400">
            Experienced coaches. Personal guidance. Training designed
            to help you move forward with confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {trainers.map((trainer) => (
            <article
              key={trainer.id}
              className="group border border-white/10 bg-zinc-900 p-7 transition duration-300 hover:-translate-y-1 hover:border-red-500 sm:p-8"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-2xl font-black">
                {trainer.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </div>

              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red-500">
                {trainer.role}
              </p>

              <h3 className="text-2xl font-extrabold">
                {trainer.name}
              </h3>

              <p className="mt-3 text-sm font-semibold text-gray-300">
                {trainer.specialty}
              </p>

              <p className="mt-4 text-sm leading-7 text-gray-400">
                {trainer.description}
              </p>

              <div className="mt-6 border-t border-white/10 pt-5">
                <span className="text-sm font-bold text-white">
                  {trainer.experience} experience
                </span>
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
      className="bg-white px-6 py-24 text-black md:px-12 lg:px-20"
    >
      <div className="mx-auto max-w-7xl">
        <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.3em] text-red-600">
          Plan your week
        </p>

        <h2 className="mb-4 text-4xl font-black sm:text-5xl">
          CLASS SCHEDULE<span className="text-red-600">.</span>
        </h2>

        <p className="mb-10 max-w-2xl leading-7 text-gray-600">
          Find your next session, meet your trainer, and make time
          for your goals.
        </p>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-zinc-950 text-white">
              <tr>
                <th className="p-4">Day</th>
                <th className="p-4">Time</th>
                <th className="p-4">Class</th>
                <th className="p-4">Trainer</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Spots</th>
              </tr>
            </thead>

            <tbody>
              {schedule.map((session) => (
                <tr
                  key={session.id}
                  className="border-t border-gray-200 transition hover:bg-red-50"
                >
                  <td className="p-4 font-bold">{session.day}</td>
                  <td className="p-4">{session.time}</td>
                  <td className="p-4 font-bold">{session.className}</td>
                  <td className="p-4">{session.trainer}</td>
                  <td className="p-4">{session.duration} min</td>
                  <td className="p-4">
                    <span className="rounded-full bg-red-100 px-3 py-1 font-bold text-red-700">
                      {session.spots} spots
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}


function Membership() {
  return (
    <section
      id="membership"
      className="bg-zinc-950 px-6 py-24 text-white md:px-12 lg:px-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.3em] text-red-500">
            Invest in yourself
          </p>

          <h2 className="text-4xl font-black sm:text-5xl">
            MEMBERSHIP PLANS<span className="text-red-500">.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-gray-400">
            Choose the plan that fits your goals and start building a
            stronger, healthier you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {memberships.map((membership) => (
            <article
              key={membership.id}
              className={`relative flex flex-col border p-7 transition duration-300 hover:-translate-y-1 sm:p-8 ${
                membership.popular
                  ? 'border-red-500 bg-zinc-900'
                  : 'border-white/10 bg-zinc-900/60'
              }`}
            >
              {membership.popular && (
                <span className="absolute right-5 top-5 rounded-full bg-red-600 px-3 py-1 text-xs font-extrabold uppercase">
                  Most popular
                </span>
              )}

              <h3 className="text-2xl font-extrabold">
                {membership.name}
              </h3>

              <p className="mt-3 min-h-14 leading-6 text-gray-400">
                {membership.description}
              </p>

              <div className="mt-6 border-b border-white/10 pb-6">
                <span className="text-4xl font-black">
                  AED {membership.price}
                </span>
                <span className="ml-2 text-sm text-gray-400">
                  / {membership.period}
                </span>
              </div>

              <ul className="my-7 flex-1 space-y-4">
                {membership.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-gray-300"
                  >
                    <span className="font-bold text-red-500">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                className={`mt-4 block rounded-md px-5 py-4 text-center text-sm font-extrabold uppercase transition ${
                  membership.popular
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'border border-white/20 text-white hover:border-red-500 hover:text-red-400'
                }`}
              >
                Choose {membership.name}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}















function About() {
  return (
    <section id="about" className="bg-white px-6 py-20 text-black md:px-12 lg:px-20">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.3em] text-red-600">
            More than a workout
          </p>
          <h2 className="text-4xl font-black leading-tight sm:text-5xl">
            SHOW UP.
            <br />
            PUT IN THE WORK.
            <br />
            <span className="text-red-600">GET STRONGER.</span>
          </h2>
        </div>

        <div>
          <p className="text-lg leading-8 text-gray-600">
            Real progress comes from consistency, commitment, and the
            willingness to keep going. Pulse Fitness is built around a
            simple idea: every session is an opportunity to improve.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-5 border-t border-gray-200 pt-6">
            <div>
              <p className="text-xl font-black">YOUR GOALS</p>
              <p className="mt-2 text-sm text-gray-500">A plan that fits your ambition.</p>
            </div>
            <div>
              <p className="text-xl font-black">YOUR PACE</p>
              <p className="mt-2 text-sm text-gray-500">Progress built one session at a time.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Contact() {
  return (
    <section id="contact" className="bg-red-600 px-6 py-20 text-center text-white md:px-12">
      <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.3em] text-white/80">
        Your next chapter starts here
      </p>

      <h2 className="mx-auto max-w-4xl text-4xl font-black leading-tight sm:text-5xl md:text-6xl">
        READY TO BECOME STRONGER?
      </h2>

      <p className="mx-auto mt-5 max-w-xl leading-7 text-white/85">
        Take the first step towards your fitness goals. Get in touch
        and start building better habits today.
      </p>

      <a
        className="mt-8 inline-flex items-center gap-3 rounded-md bg-black px-8 py-4 text-sm font-extrabold uppercase tracking-wide transition hover:bg-zinc-800"
        href="mailto:info@pulsefitness.com?subject=Pulse%20Fitness%20Membership"
      >
        Contact Pulse Fitness <span aria-hidden="true">↗️</span>
      </a>
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
      </main>
      <Footer />
    </>
  )
}

export default App