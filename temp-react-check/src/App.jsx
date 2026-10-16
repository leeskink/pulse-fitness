import { programs } from './data/programs'


function Header() {
  return (
    <header className="relative z-10 flex flex-col items-center justify-between gap-4 bg-black px-6 py-5 text-white sm:flex-row md:px-12">
      <h2 className="text-2xl font-extrabold tracking-wide text-red-500">
        PULSE FITNESS
      </h2>

      <nav className="flex gap-6 text-sm font-semibold">
        <a className="hover:text-red-500" href="#home">Home</a>
        <a className="hover:text-red-500" href="#programs">Programs</a>
        <a className="hover:text-red-500" href="#contact">Contact</a>
      </nav>
    </header>
  )
}

function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-[520px] items-center overflow-hidden bg-zinc-950 px-6 py-16 text-white sm:min-h-[580px] md:px-12 lg:px-20"
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

      <div className="absolute inset-0 bg-black/65" />

      <div className="relative z-10 max-w-3xl">
        <p className="mb-4 font-bold tracking-widest text-red-400">
          YOUR FITNESS. YOUR FUTURE.
        </p>

        <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-7xl">
          BUILD YOUR
          <br />
          BEST SELF.
        </h1>

        <p className="mt-5 text-base text-gray-200 sm:text-lg">
          Train harder. Get stronger. Become unstoppable.
        </p>

        <a
          className="mt-7 inline-block rounded-md bg-red-500 px-7 py-4 font-bold uppercase tracking-wide transition hover:bg-red-600"
          href="#programs"
        >
          Explore Programs
        </a>
      </div>
    </section>
  )
}

function Programs() {
  return (
    <section
      id="programs"
      className="bg-black px-6 py-16 text-white md:px-12 lg:px-20"
    >
      <p className="mb-3 font-bold tracking-widest text-red-500">
        OUR TRAINING
      </p>

      <h2 className="mb-8 text-3xl font-extrabold md:text-4xl">
        CHOOSE YOUR PROGRAM
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {programs.map((program) => (
          <article
            key={program.id}
            className="rounded-xl border border-white/10 bg-zinc-900 p-6 transition hover:border-red-500"
          >
            <h3 className="mb-3 text-xl font-bold text-red-500">
              {program.name}
            </h3>

            <p className="text-gray-300">
              {program.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}


function Contact() {
  return (
    <section
      id="contact"
      className="bg-zinc-100 px-6 py-20 text-center text-black md:px-12"
    >
      <p className="mb-3 font-bold tracking-widest text-red-600">
        READY TO START?
      </p>

      <h2 className="mb-5 text-3xl font-extrabold md:text-5xl">
        TAKE THE FIRST STEP.
      </h2>

      <p className="mx-auto mb-8 max-w-2xl text-gray-600">
        Your fitness journey starts here. Train with purpose and
        work towards becoming your strongest self.
      </p>

      <a
        className="inline-block rounded-md bg-red-600 px-8 py-4 font-bold uppercase tracking-wide text-white transition hover:bg-red-700"
        href="mailto:info@pulsefitness.com"
      >
        Contact Us
      </a>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-black px-6 py-8 text-center text-white">
      <h3 className="mb-2 text-xl font-extrabold tracking-wide text-red-500">
        PULSE FITNESS
      </h3>

      <p className="mb-3 text-sm text-gray-400">
        Build your best self. One workout at a time.
      </p>

      <p className="text-xs text-gray-500">
        © {new Date().getFullYear()} Pulse Fitness. All rights reserved.
      </p>
    </footer>
  )
}





function App() {
  return (
    <>
      <Header />
      <Hero />
      <Programs />
      <Contact />
      <Footer />
    </>
  )
}

export default App