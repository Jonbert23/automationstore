import { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    orderNumber: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you'd send this to your backend or Sanity
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid #333',
    borderRadius: '8px',
    fontSize: '1rem',
    marginBottom: '16px',
    outline: 'none',
    background: '#222',
    color: 'white',
  };

  return (
    <div className="dark-mode" style={{ backgroundColor: '#111', minHeight: '100vh' }}>
      {/* Page Header */}
      <div style={{ 
        padding: '150px 0 80px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
        borderBottom: '1px solid #333'
      }}>
        <div className="container">
          <h1 style={{ color: 'white' }}>Get In Touch</h1>
          <p style={{ color: '#9ca3af', marginTop: '10px' }}>
            Questions about our scripts? We're here to help.
          </p>
        </div>
      </div>

      <section className="container" style={{ padding: '60px 20px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '50px' }}>
          {/* Contact Form */}
          <div style={{ 
            background: '#1a1a1a', 
            border: '1px solid #333', 
            borderRadius: '16px', 
            padding: '40px' 
          }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <i className="fas fa-check-circle" style={{ fontSize: '4rem', color: '#D9FF00', marginBottom: '20px' }}></i>
                <h2 style={{ color: 'white' }}>Message Sent!</h2>
                <p style={{ color: '#9ca3af', marginTop: '10px' }}>
                  Thanks for reaching out. We'll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#9ca3af', fontSize: '0.9rem' }}>Name</label>
                    <input 
                      type="text" 
                      name="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={handleChange}
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#9ca3af', fontSize: '0.9rem' }}>Email</label>
                    <input 
                      type="email" 
                      name="email"
                      placeholder="Your email"
                      value={formData.email}
                      onChange={handleChange}
                      style={inputStyle}
                      required
                    />
                  </div>
                </div>
                
                <label style={{ display: 'block', marginBottom: '8px', color: '#9ca3af', fontSize: '0.9rem' }}>Order Number (Optional)</label>
                <input 
                  type="text" 
                  name="orderNumber"
                  placeholder="#SHZ-0000"
                  value={formData.orderNumber}
                  onChange={handleChange}
                  style={inputStyle}
                />
                
                <label style={{ display: 'block', marginBottom: '8px', color: '#9ca3af', fontSize: '0.9rem' }}>Subject</label>
                <select 
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Order Status">Order Status</option>
                  <option value="Script Support">Script Support</option>
                  <option value="Custom Request">Custom Script Request</option>
                  <option value="Refund Request">Refund Request</option>
                </select>
                
                <label style={{ display: 'block', marginBottom: '8px', color: '#9ca3af', fontSize: '0.9rem' }}>Message</label>
                <textarea 
                  name="message"
                  rows="6" 
                  placeholder="How can we help?"
                  value={formData.message}
                  onChange={handleChange}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  required
                ></textarea>
                
                <button type="submit" className="btn" style={{ 
                  background: '#D9FF00', 
                  color: '#111', 
                  border: 'none',
                  width: '100%',
                  padding: '16px'
                }}>
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div>
            <div style={{ 
              background: '#1a1a1a', 
              border: '1px solid #333', 
              borderRadius: '16px', 
              padding: '30px',
              marginBottom: '20px'
            }}>
              <h4 style={{ color: '#D9FF00', marginBottom: '20px' }}>Quick Contact</h4>
              
              <div style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <i className="fab fa-facebook-messenger" style={{ color: '#D9FF00', fontSize: '1.2rem' }}></i>
                  <strong style={{ color: 'white' }}>Facebook Messenger</strong>
                </div>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Fastest response time!</p>
                <a 
                  href="https://m.me/shuzee" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ 
                    display: 'inline-block',
                    marginTop: '10px',
                    background: '#D9FF00',
                    color: '#111',
                    border: 'none',
                    padding: '10px 20px',
                    fontSize: '0.9rem'
                  }}
                >
                  <span><i className="fab fa-facebook-messenger" style={{ marginRight: '8px' }}></i>Message Us</span>
                </a>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <i className="fas fa-envelope" style={{ color: '#D9FF00', fontSize: '1.2rem' }}></i>
                  <strong style={{ color: 'white' }}>Email</strong>
                </div>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>support@shuzee.com</p>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <i className="fas fa-clock" style={{ color: '#D9FF00', fontSize: '1.2rem' }}></i>
                  <strong style={{ color: 'white' }}>Response Time</strong>
                </div>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Usually within 2-4 hours during business hours (9AM - 9PM PHT)</p>
              </div>
            </div>

            {/* FAQ Shortcuts */}
            <div style={{ 
              background: '#1a1a1a', 
              border: '1px solid #333', 
              borderRadius: '16px', 
              padding: '30px'
            }}>
              <h4 style={{ color: '#D9FF00', marginBottom: '20px' }}>Common Questions</h4>
              
              <div style={{ marginBottom: '15px' }}>
                <h5 style={{ color: 'white', fontSize: '0.95rem', marginBottom: '5px' }}>How do I access my purchase?</h5>
                <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  After payment verification, you'll get instant access via Google Drive link in your account.
                </p>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <h5 style={{ color: 'white', fontSize: '0.95rem', marginBottom: '5px' }}>What Photoshop version do I need?</h5>
                <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  Most scripts work with Photoshop CC 2020 and later. Check product details for specifics.
                </p>
              </div>
              
              <div>
                <h5 style={{ color: 'white', fontSize: '0.95rem', marginBottom: '5px' }}>Can I request a custom script?</h5>
                <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  Yes! Message us with your requirements and we'll provide a quote.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
