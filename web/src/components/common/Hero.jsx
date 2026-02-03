import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="hero" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556906781-9a412961c28c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}>
      <div className="hero-content">
        <h1>Unleash Your<br /><span style={{ color: 'var(--accent)' }}>Potential</span></h1>
        <p>Engineered for speed. Designed for the streets.</p>
        <Link to="/shop" className="btn"><span>Shop Latest</span></Link>
      </div>
    </section>
  );
};

export default Hero;
