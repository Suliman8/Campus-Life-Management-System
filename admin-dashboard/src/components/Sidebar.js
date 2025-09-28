import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ user, onLogout }) => {
  const location = useLocation();

  const sidebarStyle = {
    backgroundColor: '#2c3e50',
    color: 'white',
    height: '100vh',
    width: '280px',
    position: 'fixed',
    left: 0,
    top: 0,
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
    zIndex: 100
  };

  const headerStyle = {
    padding: '30px 20px',
    backgroundColor: '#34495e',
    borderBottom: '1px solid #3d566e'
  };

  const logoStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '8px'
  };

  const userInfoStyle = {
    fontSize: '14px',
    opacity: 0.8
  };

  const navStyle = {
    flex: 1,
    padding: '20px 0'
  };

  const navItemStyle = {
    display: 'block',
    padding: '15px 25px',
    color: 'white',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    borderLeft: '4px solid transparent',
    fontSize: '16px'
  };

  const activeNavItemStyle = {
    ...navItemStyle,
    backgroundColor: '#3d566e',
    borderLeftColor: '#3498db',
    paddingLeft: '30px'
  };

  const footerStyle = {
    padding: '20px',
    borderTop: '1px solid #3d566e'
  };

  const logoutButtonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/students', label: 'Student Management', icon: '👥' },
    { path: '/courses', label: 'Course Management', icon: '📚' },
    { path: '/grades', label: 'Grade Management', icon: '📝' },
    { path: '/events', label: 'Event Management', icon: '🎉' },
    { path: '/reports', label: 'Reports', icon: '📈' },
    { path: '/settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div style={sidebarStyle}>
      <div style={headerStyle}>
        <div style={logoStyle}>Admin Dashboard</div>
        <div style={userInfoStyle}>
          Welcome, {user?.name || 'Admin'}
          <br />
          <small>{user?.role || 'Administrator'}</small>
        </div>
      </div>

      <nav style={navStyle}>
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            style={location.pathname === item.path ? activeNavItemStyle : navItemStyle}
          >
            <span style={{ marginRight: '12px' }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div style={footerStyle}>
        <button
          style={logoutButtonStyle}
          onClick={onLogout}
          onMouseOver={(e) => e.target.style.backgroundColor = '#c0392b'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#e74c3c'}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;