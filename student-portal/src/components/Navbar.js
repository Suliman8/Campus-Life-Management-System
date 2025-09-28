import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();

  const navStyle = {
    backgroundColor: '#007bff',
    padding: '1rem 0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px'
  };

  const logoStyle = {
    color: 'white',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textDecoration: 'none'
  };

  const navLinksStyle = {
    display: 'flex',
    listStyle: 'none',
    gap: '2rem',
    alignItems: 'center'
  };

  const linkStyle = {
    color: 'white',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    transition: 'background-color 0.2s'
  };

  const activeLinkStyle = {
    ...linkStyle,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  };

  const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    color: 'white'
  };

  const logoutBtnStyle = {
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  };

  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        <Link to="/dashboard" style={logoStyle}>
          Student Portal
        </Link>

        <ul style={navLinksStyle}>
          <li>
            <Link
              to="/dashboard"
              style={location.pathname === '/dashboard' ? activeLinkStyle : linkStyle}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/courses"
              style={location.pathname === '/courses' ? activeLinkStyle : linkStyle}
            >
              Courses
            </Link>
          </li>
          <li>
            <Link
              to="/events"
              style={location.pathname === '/events' ? activeLinkStyle : linkStyle}
            >
              Events
            </Link>
          </li>
          <li>
            <Link
              to="/cafeteria"
              style={location.pathname === '/cafeteria' ? activeLinkStyle : linkStyle}
            >
              Cafeteria
            </Link>
          </li>
          <li>
            <Link
              to="/library"
              style={location.pathname === '/library' ? activeLinkStyle : linkStyle}
            >
              Library
            </Link>
          </li>
          <li>
            <Link
              to="/payments"
              style={location.pathname === '/payments' ? activeLinkStyle : linkStyle}
            >
              Payments
            </Link>
          </li>
          <li>
            <Link
              to="/profile"
              style={location.pathname === '/profile' ? activeLinkStyle : linkStyle}
            >
              Profile
            </Link>
          </li>
        </ul>

        <div style={userInfoStyle}>
          <span>Welcome, {user?.name}</span>
          <button style={logoutBtnStyle} onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;