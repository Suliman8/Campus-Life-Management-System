import React, { useState } from 'react';

const Settings = ({ user }) => {
  const [settings, setSettings] = useState({
    profile: {
      name: user?.name || 'Dr. Sarah Johnson',
      email: user?.email || 'admin@campus.edu',
      role: user?.role || 'System Administrator',
      phone: '+1-555-123-4567'
    },
    system: {
      maintenance: false,
      notifications: true,
      backup: 'daily',
      theme: 'light'
    },
    security: {
      twoFactor: true,
      sessionTimeout: '30',
      passwordExpiry: '90'
    }
  });

  const [activeTab, setActiveTab] = useState('profile');

  const handleProfileChange = (field, value) => {
    setSettings({
      ...settings,
      profile: { ...settings.profile, [field]: value }
    });
  };

  const handleSystemChange = (field, value) => {
    setSettings({
      ...settings,
      system: { ...settings.system, [field]: value }
    });
  };

  const handleSecurityChange = (field, value) => {
    setSettings({
      ...settings,
      security: { ...settings.security, [field]: value }
    });
  };

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  const tabButtonStyle = (isActive) => ({
    padding: '12px 24px',
    border: 'none',
    backgroundColor: isActive ? '#007bff' : '#f8f9fa',
    color: isActive ? 'white' : '#495057',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: isActive ? '500' : 'normal',
    marginRight: '10px'
  });

  return (
    <div className="container">
      <div className="card">
        <h1 style={{ color: '#2c3e50', marginBottom: '20px' }}>System Settings</h1>

        <div style={{ display: 'flex', marginBottom: '30px' }}>
          <button
            style={tabButtonStyle(activeTab === 'profile')}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile Settings
          </button>
          <button
            style={tabButtonStyle(activeTab === 'system')}
            onClick={() => setActiveTab('system')}
          >
            ⚙️ System Settings
          </button>
          <button
            style={tabButtonStyle(activeTab === 'security')}
            onClick={() => setActiveTab('security')}
          >
            🔒 Security Settings
          </button>
        </div>

        {activeTab === 'profile' && (
          <div>
            <h2 style={{ color: '#495057', marginBottom: '20px' }}>Profile Information</h2>
            <div className="grid grid-2" style={{ gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.profile.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={settings.profile.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-input"
                  value={settings.profile.role}
                  onChange={(e) => handleProfileChange('role', e.target.value)}
                >
                  <option value="System Administrator">System Administrator</option>
                  <option value="Faculty Administrator">Faculty Administrator</option>
                  <option value="Department Admin">Department Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={settings.profile.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div>
            <h2 style={{ color: '#495057', marginBottom: '20px' }}>System Configuration</h2>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>Maintenance Mode</h4>
                  <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>Enable maintenance mode to perform system updates</p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.system.maintenance}
                    onChange={(e) => handleSystemChange('maintenance', e.target.checked)}
                    style={{ marginRight: '10px' }}
                  />
                  <span>{settings.system.maintenance ? 'Enabled' : 'Disabled'}</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>Email Notifications</h4>
                  <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>Receive system notifications via email</p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.system.notifications}
                    onChange={(e) => handleSystemChange('notifications', e.target.checked)}
                    style={{ marginRight: '10px' }}
                  />
                  <span>{settings.system.notifications ? 'Enabled' : 'Disabled'}</span>
                </label>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Backup Frequency</h4>
                <select
                  className="form-input"
                  value={settings.system.backup}
                  onChange={(e) => handleSystemChange('backup', e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Theme</h4>
                <select
                  className="form-input"
                  value={settings.system.theme}
                  onChange={(e) => handleSystemChange('theme', e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div>
            <h2 style={{ color: '#495057', marginBottom: '20px' }}>Security Configuration</h2>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>Two-Factor Authentication</h4>
                  <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>Add extra security to your account</p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.security.twoFactor}
                    onChange={(e) => handleSecurityChange('twoFactor', e.target.checked)}
                    style={{ marginRight: '10px' }}
                  />
                  <span>{settings.security.twoFactor ? 'Enabled' : 'Disabled'}</span>
                </label>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Session Timeout (minutes)</h4>
                <select
                  className="form-input"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                </select>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0' }}>Password Expiry (days)</h4>
                <select
                  className="form-input"
                  value={settings.security.passwordExpiry}
                  onChange={(e) => handleSecurityChange('passwordExpiry', e.target.value)}
                >
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                  <option value="never">Never</option>
                </select>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>Change Password</h4>
                <div className="grid grid-2" style={{ gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input type="password" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input type="password" className="form-input" />
                  </div>
                </div>
                <button className="btn btn-warning" style={{ marginTop: '10px' }}>
                  🔑 Update Password
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #dee2e6' }}>
          <button className="btn btn-secondary">Cancel</button>
          <button className="btn" onClick={handleSave}>💾 Save Settings</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;