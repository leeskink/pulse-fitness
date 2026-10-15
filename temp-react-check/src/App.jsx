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
      <p>YOUR FITNESS. YOUR FUTURE.</p>
      <h1>BUILD YOUR<br />BEST SELF.</h1>
      <p>Train harder. Get stronger. Become unstoppable.</p>
      <a className="button" href="#programs">
        Explore Programs
      </a>
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



function App() {
  return (
    <>
      <Header />
      <Hero />
      <Programs />
    </>
  )
}

export default App