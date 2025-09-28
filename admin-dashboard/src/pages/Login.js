import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Mock API call
      setTimeout(() => {
        if (formData.email === 'admin@campus.edu' && formData.password === 'admin123') {
          onLogin({
            id: '1',
            name: 'Dr. Sarah Johnson',
            email: 'admin@campus.edu',
            role: 'System Administrator',
            permissions: ['all'],
            token: 'admin-token-123'
          });
        } else if (formData.email === 'faculty@campus.edu' && formData.password === 'faculty123') {
          onLogin({
            id: '2',
            name: 'Prof. Michael Davis',
            email: 'faculty@campus.edu',
            role: 'Faculty Administrator',
            permissions: ['courses', 'grades', 'students'],
            token: 'faculty-token-456'
          });
        } else {
          setError('Invalid email or password');
        }
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  };

  const formContainerStyle = {
    backgroundColor: 'white',
    padding: '3rem',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    width: '100%',
    maxWidth: '450px'
  };

  const titleStyle = {
    textAlign: 'center',
    marginBottom: '2rem',
    color: '#2c3e50',
    fontSize: '2rem',
    fontWeight: 'bold'
  };

  const subtitleStyle = {
    textAlign: 'center',
    marginBottom: '2rem',
    color: '#7f8c8d',
    fontSize: '16px'
  };

  const errorStyle = {
    color: '#e74c3c',
    backgroundColor: '#fadbd8',
    border: '1px solid #f5b7b1',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center'
  };

  const demoBoxStyle = {
    marginTop: '25px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    fontSize: '14px',
    border: '1px solid #e9ecef'
  };

  const demoAccountStyle = {
    marginBottom: '12px',
    padding: '8px',
    backgroundColor: 'white',
    borderRadius: '6px',
    border: '1px solid #dee2e6'
  };

  return (
    <div style={containerStyle}>
      <div style={formContainerStyle}>
        <h1 style={titleStyle}>Admin Dashboard</h1>
        <p style={subtitleStyle}>Campus Life Management System</p>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your admin email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="btn"
            disabled={loading}
            style={{ width: '100%', marginBottom: '1rem', padding: '15px' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={demoBoxStyle}>
          <strong>Demo Accounts:</strong>

          <div style={demoAccountStyle}>
            <strong>System Administrator:</strong><br />
            Email: admin@campus.edu<br />
            Password: admin123<br />
            <small style={{ color: '#6c757d' }}>Full access to all features</small>
          </div>

          <div style={demoAccountStyle}>
            <strong>Faculty Administrator:</strong><br />
            Email: faculty@campus.edu<br />
            Password: faculty123<br />
            <small style={{ color: '#6c757d' }}>Limited to academic management</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;