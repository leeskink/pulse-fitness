import './App.css'

function Header() {
  return (
    <header className="header">
      <h2>PULSE FITNESS</h2>
      <nav>
        <a href="#home">Home</a>
        <a href="#programs">Programs</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
  )
}


function Hero() {
  return (
    <section className="hero" id="home">
      <video
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      >
        <source src="/gymvid.mp4" type="video/mp4" />
      </video>

      <div className="hero-content">
        <p>YOUR FITNESS. YOUR FUTURE.</p>
        <h1>
          BUILD YOUR
          <br />
          BEST SELF.
        </h1>
        <p>Train harder. Get stronger. Become unstoppable.</p>
        <a className="button" href="#programs">
          Explore Programs
        </a>
      </div>
    </section>
  )
}


function Programs() {
return ( <section className="programs" id="programs"> <p>OUR TRAINING</p> <h2>CHOOSE YOUR PROGRAM</h2>


  <div className="program-list">
    <article className="program-card">
      <h3>Strength Training</h3>
      <p>Build strength and develop muscle with structured workouts.</p>
    </article>

    <article className="program-card">
      <h3>Cardio Fitness</h3>
      <p>Improve endurance, stamina, and overall fitness.</p>
    </article>

    <article className="program-card">
      <h3>Personal Training</h3>
      <p>Train with a focused plan designed around your goals.</p>
    </article>
  </div>
</section>


);
}

function Contact() {
return ( <section className="contact" id="contact"> <p>READY TO START?</p> <h2>TAKE THE FIRST STEP.</h2> <p>
Your fitness journey starts here. Train with purpose and
work towards becoming your strongest self. </p> <a className="button" href="mailto:info@pulsefitness.com">
Contact Us </a> </section>
)
}

function Footer() {
return ( <footer className="footer"> <h3>PULSE FITNESS</h3> <p>Build your best self. One workout at a time.</p> <p>© {new Date().getFullYear()} Pulse Fitness. All rights reserved.</p> </footer>
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