import { useState } from 'react';
import '../assets/css/contact.css';

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

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <h1>Get In Touch</h1>
          <p style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '2px', color: '#666' }}>
            We're here to help you perform your best.
          </p>
        </div>
      </div>

      <section className="container contact-grid">
        {/* Contact Form */}
        <div className="contact-form">
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <i className="fas fa-check-circle" style={{ fontSize: '4rem', color: 'var(--success)', marginBottom: '20px' }}></i>
              <h2>Message Sent!</h2>
              <p style={{ color: '#666', marginTop: '10px' }}>
                Thanks for reaching out. We'll get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input 
                    type="text" 
                    name="name"
                    className="form-control" 
                    placeholder="YOUR NAME"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    name="email"
                    className="form-control" 
                    placeholder="YOUR EMAIL"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Order Number (Optional)</label>
                <input 
                  type="text" 
                  name="orderNumber"
                  className="form-control" 
                  placeholder="#APX-0000"
                  value={formData.orderNumber}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <select 
                  name="subject"
                  className="form-control"
                  value={formData.subject}
                  onChange={handleChange}
                >
                  <option>General Inquiry</option>
                  <option>Order Status</option>
                  <option>Returns & Exchanges</option>
                  <option>Product Information</option>
                </select>
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea 
                  name="message"
                  className="form-control" 
                  rows="6" 
                  placeholder="HOW CAN WE HELP?"
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn"><span>SEND MESSAGE</span></button>
            </form>
          )}
        </div>

        {/* Contact Info */}
        <div className="contact-info-box">
          <div className="info-item">
            <h4>HQ Location</h4>
            <p>APEX Performance Labs<br />500 Sprint Blvd, Suite 100<br />Portland, OR 97205</p>
          </div>
          <div className="info-item">
            <h4>Customer Support</h4>
            <p>support@apex.com<br />1-800-RUN-FAST</p>
          </div>
          <div className="info-item">
            <h4>Live Chat Hours</h4>
            <p>Mon - Fri: 6am - 8pm PST<br />Sat - Sun: 8am - 5pm PST</p>
          </div>
          <div className="info-item">
            <h4>Social</h4>
            <div style={{ display: 'flex', gap: '20px', fontSize: '1.5rem', marginTop: '15px' }}>
              <a href="#" style={{ color: 'white' }}><i className="fab fa-instagram"></i></a>
              <a href="#" style={{ color: 'white' }}><i className="fab fa-twitter"></i></a>
              <a href="#" style={{ color: 'white' }}><i className="fab fa-youtube"></i></a>
              <a href="#" style={{ color: 'white' }}><i className="fab fa-tiktok"></i></a>
            </div>
          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <div style={{ height: '450px', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', borderTop: '5px solid var(--accent)' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-map-marked-alt" style={{ fontSize: '4rem', marginBottom: '20px', color: '#333' }}></i>
          <h3 style={{ color: '#444' }}>Global Store Locator</h3>
        </div>
      </div>
    </>
  );
};

export default Contact;
