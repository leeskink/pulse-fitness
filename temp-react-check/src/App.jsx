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

function App() {
  return (
    <>
      <Header />
      <Hero />
    </>
  )
}

export default App