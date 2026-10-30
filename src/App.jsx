import { useEffect, useState } from "react";
import AdminDashboard from "./components/AdminDashboard";
import Auth from "./components/Auth";
import { programs } from "./data/programs";
import { trainers } from "./data/trainers";
import { classes } from "./data/classes";
import { memberships } from "./data/membership";
import { schedule } from "./data/schedule";

const programImages = {
  "Strength Training": "/images/strength.jpg",
  "Cardio Fitness": "/images/cardio.jpg",
  "Personal Training": "/images/personal-training.jpg",
};
const trainerImages = ["/images/trainer-1.jpg", "/images/trainer-2.jpg", "/images/trainer-3.jpg"];

function Brand({ footer = false }) {
  return <a className={`brand ${footer ? "brand-footer" : ""}`} href="#home" aria-label="Pulse Fitness home">
    PULSE<span>.</span>FITNESS
  </a>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const links = [["Programs", "#programs"], ["Coaches", "#trainers"], ["Classes", "#classes"], ["Schedule", "#schedule"], ["Membership", "#membership"]];
  return <header className="site-header">
    <div className="nav-shell">
      <Brand />
      <nav className={`main-nav ${open ? "nav-open" : ""}`} aria-label="Main navigation">
        {links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
        <a className="nav-mobile-cta" href="#account" onClick={() => setOpen(false)}>Join Pulse <span>↗</span></a>
      </nav>
      <a className="button button-small nav-cta" href="#account">Join Pulse <span>↗</span></a>
      <button className="menu-toggle" type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"}>{open ? "×" : "☰"}</button>
    </div>
  </header>;
}

function Eyebrow({ children }) { return <p className="eyebrow"><span />{children}</p>; }

function Hero() {
  return <section className="hero" id="home">
    <video className="hero-video" autoPlay muted loop playsInline poster="/images/strength.jpg" aria-hidden="true">
      <source src="/gymvid.mp4" type="video/mp4" />
    </video>
    <div className="hero-shade" />
    <div className="container hero-content">
      <Eyebrow>Your fitness. Your future.</Eyebrow>
      <h1>BUILT BY<br /><em>DISCIPLINE.</em><br />DEFINED BY YOU.</h1>
      <p className="hero-copy">A smarter approach to strength, conditioning and personal performance. Train with purpose. Make progress that lasts.</p>
      <div className="hero-actions">
        <a className="button" href="#programs">Explore programmes <span>↗</span></a>
        <a className="button button-outline" href="#about">Discover Pulse</a>
      </div>
      <div className="hero-proof"><span>01 / TRAIN WITH PURPOSE</span><span>02 / PROGRESS WITH INTENT</span><span>03 / OWN YOUR JOURNEY</span></div>
    </div>
    <div className="hero-index">PULSE FITNESS <b>—</b> EST. PERFORMANCE</div>
  </section>;
}

function SectionHeading({ eyebrow, title, copy }) {
  return <div className="section-heading">
    <div><Eyebrow>{eyebrow}</Eyebrow><h2>{title}<i>.</i></h2></div>
    {copy && <p>{copy}</p>}
  </div>;
}

function Programs() {
  return <section className="section section-dark" id="programs">
    <div className="container">
      <SectionHeading eyebrow="Find your strength" title="TRAIN YOUR WAY" copy="Focused programmes for every goal. Build a stronger foundation, improve your conditioning and train with expert support." />
      <div className="program-grid">
        {programs.map((item, index) => <article className="program-card" key={item.id}>
          <img src={programImages[item.name] || "/images/strength.jpg"} alt={item.name} loading="lazy" />
          <div className="program-overlay" />
          <div className="card-number">0{index + 1}</div>
          <div className="program-content"><span className="tag">{item.category}</span><h3>{item.name}</h3><p>{item.description}</p><a href="#account" className="text-link">Explore programme <span>↗</span></a></div>
        </article>)}
      </div>
    </div>
  </section>;
}

function Trainers() {
  return <section className="section section-black" id="trainers">
    <div className="container">
      <SectionHeading eyebrow="Meet your coaches" title="EXPERTS IN YOUR CORNER" copy="Great coaching makes the difference. Meet a team focused on good technique, smart programming and measurable progress." />
      <div className="trainer-grid">
        {trainers.map((trainer, index) => <article className="trainer-card" key={trainer.id}>
          <div className="trainer-photo"><img src={trainerImages[index % trainerImages.length]} alt={trainer.name} loading="lazy" /><span>0{index + 1}</span></div>
          <div className="trainer-info"><p className="trainer-role">{trainer.role}</p><h3>{trainer.name}</h3><p className="trainer-specialty">{trainer.specialty}</p><p className="trainer-bio">{trainer.description}</p><div className="trainer-meta"><span>Experience</span><strong>{trainer.experience}</strong></div></div>
        </article>)}
      </div>
      <p className="content-note">Coach profiles shown here are sample website content. Publish verified staff details before launch.</p>
    </div>
  </section>;
}

function Classes() {
  return <section className="section section-dark" id="classes">
    <div className="container">
      <SectionHeading eyebrow="Train together" title="FIND YOUR CLASS" copy="From high-intensity conditioning to strength and recovery, find a class that fits your goals and your week." />
      <div className="class-grid">
        {classes.map((item, index) => <article className="class-card" key={item.id}>
          <div className="class-top"><span>0{index + 1}</span><span>{item.category}</span></div>
          <h3>{item.name}</h3><p>{item.description}</p>
          <div className="class-bottom"><span>{item.duration} MIN</span><span>{item.level || "All levels"}</span></div>
        </article>)}
      </div>
    </div>
  </section>;
}

function Schedule() {
  return <section className="section section-black" id="schedule">
    <div className="container">
      <SectionHeading eyebrow="Plan your week" title="THE CLASS SCHEDULE" copy="A sample weekly timetable to help members plan ahead. Confirm live class availability with the gym before attending." />
      <div className="schedule-wrap">
        <table className="schedule-table">
          <thead><tr><th>Day</th><th>Time</th><th>Class</th><th>Coach</th><th>Duration</th><th>Places</th></tr></thead>
          <tbody>{schedule.map(item => <tr key={item.id}><td>{item.day}</td><td>{item.time}</td><td className="schedule-class">{item.className}</td><td>{item.trainer}</td><td>{item.duration} min</td><td><span className="places">{item.spots} places</span></td></tr>)}</tbody>
        </table>
      </div>
      <p className="content-note">This public timetable is currently sample data; it is not connected to live bookings.</p>
    </div>
  </section>;
}

function Membership() {
  return <section className="section section-dark" id="membership">
    <div className="container">
      <SectionHeading eyebrow="Invest in yourself" title="MEMBERSHIP OPTIONS" copy="Choose the level of support that matches your ambition. Clear options, no unnecessary complexity." />
      <div className="membership-grid">
        {memberships.map(plan => <article className={`membership-card ${plan.popular ? "membership-featured" : ""}`} key={plan.id}>
          {plan.popular && <div className="popular-label">MOST POPULAR</div>}
          <p className="plan-kicker">PULSE / {String(plan.id).padStart(2, "0")}</p>
          <h3>{plan.name}</h3><p className="plan-description">{plan.description}</p>
          <div className="plan-price"><span>AED</span><strong>{plan.price}</strong><small>/ {plan.period}</small></div>
          <div className="plan-divider" /><p className="feature-label">MEMBERSHIP INCLUDES</p>
          <ul>{plan.features.map(feature => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
          <a className={`button plan-button ${plan.popular ? "" : "button-outline"}`} href="#account">Choose {plan.name} <span>↗</span></a>
        </article>)}
      </div>
      <p className="content-note">Prices and plan inclusions are sample content. Confirm commercial terms before accepting payments.</p>
    </div>
  </section>;
}

function About() {
  return <section className="section about-section" id="about"><div className="container about-grid">
    <div><Eyebrow>More than a workout</Eyebrow><h2>SHOW UP.<br />PUT IN THE WORK.<br /><em>GET STRONGER.</em></h2></div>
    <div className="about-copy"><p>Progress is built through consistency, coaching and a plan that makes sense for you. Pulse Fitness brings training, community and accountability together under one roof.</p><div className="about-values"><div><span>01 / MINDSET</span><h3>YOUR GOALS</h3><p>A plan built around what matters to you.</p></div><div><span>02 / JOURNEY</span><h3>YOUR PACE</h3><p>Progress measured one session at a time.</p></div></div></div>
  </div></section>;
}

function Contact() {
  return <section className="contact-band"><div className="container contact-inner"><div><Eyebrow>Your next chapter starts here</Eyebrow><h2>READY TO<br />BECOME STRONGER?</h2><p>Talk to our team about memberships, coaching and getting started.</p></div><a className="button button-light" href="#account">Join Pulse Fitness <span>↗</span></a></div></section>;
}

function Footer() {
  return <footer className="site-footer"><div className="container footer-main"><div><Brand footer /><p>Train with purpose. Build your best self.</p></div><div className="footer-links"><a href="#programs">Programmes</a><a href="#trainers">Coaches</a><a href="#schedule">Schedule</a><a href="#membership">Membership</a><a href="#account">Member access</a></div><div className="footer-contact"><span>GET IN TOUCH</span><a href="mailto:info@pulsefitness.com">info@pulsefitness.com</a><span>Dubai, United Arab Emirates</span></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Pulse Fitness. All rights reserved.</span><span>TRAIN SMARTER. LIVE STRONGER.</span></div></footer>;
}

function AccountSection({ user, checking, onLogin, onLogout }) {
  return <section className="account-section" id="account"><div className="container account-layout"><div className="account-intro"><Eyebrow>Member access</Eyebrow><h2>YOUR JOURNEY<br />STARTS HERE.</h2><p>Sign in to your account or create a member profile to get started with Pulse Fitness.</p><div className="account-assurance"><span>SECURE MEMBER ACCESS</span><span>PERSONAL FITNESS JOURNEY</span></div></div><div className="account-panel">{checking ? <p className="account-loading">Checking your account…</p> : user ? <div className="logged-in"><span className="tag">ACCOUNT ACTIVE</span><h3>Welcome back, {user.fullName}.</h3><p>{user.email}</p><button className="button button-outline" onClick={onLogout}>Log out</button></div> : <Auth onLogin={onLogin} />}</div></div></section>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  useEffect(() => {
    if (window.location.pathname === "/admin") return;
    let active = true;
    fetch("/api/auth/me", { credentials: "include" })
      .then(async response => response.ok ? (await response.json()).user : null)
      .then(currentUser => { if (active) setUser(currentUser); })
      .catch(error => console.error("Session check failed:", error))
      .finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, []);
  async function logout() {
    const response = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    if (response.ok) setUser(null);
  }
  if (window.location.pathname === "/admin") return <AdminDashboard />;
  return <><Header /><main><Hero /><Programs /><Trainers /><Classes /><Schedule /><Membership /><About /><Contact /><AccountSection user={user} checking={checkingSession} onLogin={setUser} onLogout={logout} /></main><Footer /></>;
}
