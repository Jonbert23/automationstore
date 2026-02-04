import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="hero" style={{ 
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '85vh',
      padding: '80px 20px'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300d4ff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      
      {/* Photoshop-style floating elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '5%',
        width: '300px',
        height: '300px',
        background: 'linear-gradient(45deg, #00d4ff22, #7c3aed22)',
        borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
        animation: 'float 6s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        left: '10%',
        width: '200px',
        height: '200px',
        background: 'linear-gradient(45deg, #f59e0b22, #ef444422)',
        borderRadius: '70% 30% 30% 70% / 60% 40% 60% 40%',
        animation: 'float 8s ease-in-out infinite reverse',
      }} />

      <div className="hero-content" style={{ 
        position: 'relative', 
        zIndex: 2,
        maxWidth: '900px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '10px', 
          background: 'rgba(0,212,255,0.1)', 
          padding: '8px 20px', 
          borderRadius: '30px',
          marginBottom: '20px',
          border: '1px solid rgba(0,212,255,0.3)'
        }}>
          <i className="fab fa-adobe" style={{ color: '#00d4ff' }}></i>
          <span style={{ fontSize: '0.9rem', color: '#00d4ff', fontWeight: 600 }}>Photoshop Automation Tools</span>
        </div>
        
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1.1 }}>
          Automate Your<br />
          <span style={{ 
            background: 'linear-gradient(90deg, #00d4ff, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Photoshop Workflow</span>
        </h1>
        
        <p style={{ fontSize: '1.2rem', opacity: 0.8, maxWidth: '500px', margin: '20px auto 30px' }}>
          Save hours of repetitive work with our professional JSX scripts and actions. 
          Perfect for jersey mockups, sewing patterns, and bulk editing.
        </p>
        
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/shop" className="btn" style={{ 
            background: 'linear-gradient(90deg, #00d4ff, #7c3aed)',
            border: 'none',
            padding: '15px 35px',
            fontSize: '1rem'
          }}>
            <span><i className="fas fa-bolt" style={{ marginRight: '8px' }}></i>Browse Scripts</span>
          </Link>
          <Link to="/shop" className="btn btn-outline" style={{ 
            borderColor: 'rgba(255,255,255,0.3)',
            color: 'white',
            padding: '15px 35px'
          }}>
            <span><i className="fas fa-play-circle" style={{ marginRight: '8px' }}></i>See Demo</span>
          </Link>
        </div>

        {/* Stats */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '50px', 
          marginTop: '50px',
          flexWrap: 'wrap'
        }}>
          {[
            { value: '500+', label: 'Happy Customers' },
            { value: '50+', label: 'Scripts Available' },
            { value: '10hrs+', label: 'Time Saved Daily' },
          ].map((stat, index) => (
            <div key={index} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#00d4ff' }}>{stat.value}</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
      `}</style>
    </section>
  );
};

export default Hero;
