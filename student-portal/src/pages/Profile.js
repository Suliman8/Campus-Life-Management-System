import React, { useState, useEffect } from 'react';

const Profile = ({ user }) => {
  const [profileData, setProfileData] = useState({
    personalInfo: {},
    academicInfo: {},
    contactInfo: {},
    preferences: {}
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    // Mock profile data
    const mockProfile = {
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '2000-05-15',
        gender: 'Male',
        nationality: 'American',
        bloodType: 'O+',
        emergencyContact: 'Jane Doe',
        emergencyPhone: '+1-555-123-4567'
      },
      academicInfo: {
        studentId: 'ST001',
        program: 'Computer Science',
        year: '3rd Year',
        semester: 'Fall 2025',
        advisor: 'Dr. Smith',
        gpa: 3.75,
        credits: 90,
        expectedGraduation: 'Spring 2026'
      },
      contactInfo: {
        email: 'student@campus.edu',
        phone: '+1-555-987-6543',
        address: '123 Campus Drive',
        city: 'University City',
        state: 'CA',
        zipCode: '12345',
        country: 'United States'
      },
      preferences: {
        language: 'English',
        timezone: 'Pacific Standard Time',
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        privacy: {
          profileVisible: true,
          showGrades: false,
          showSchedule: true
        }
      }
    };

    setProfileData(mockProfile);
    setEditedData(mockProfile);
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData({ ...profileData });
  };

  const handleSave = () => {
    setProfileData(editedData);
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleCancel = () => {
    setEditedData(profileData);
    setIsEditing(false);
  };

  const handleInputChange = (section, field, value) => {
    setEditedData({
      ...editedData,
      [section]: {
        ...editedData[section],
        [field]: value
      }
    });
  };

  const handleNestedInputChange = (section, subsection, field, value) => {
    setEditedData({
      ...editedData,
      [section]: {
        ...editedData[section],
        [subsection]: {
          ...editedData[section][subsection],
          [field]: value
        }
      }
    });
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '20px',
    marginBottom: '20px'
  };

  const headerStyle = {
    color: '#333',
    marginBottom: '20px',
    borderBottom: '2px solid #007bff',
    paddingBottom: '10px'
  };

  const tabStyle = {
    display: 'flex',
    marginBottom: '20px',
    borderBottom: '1px solid #ddd'
  };

  const tabButtonStyle = (isActive) => ({
    padding: '10px 20px',
    border: 'none',
    backgroundColor: 'transparent',
    borderBottom: isActive ? '2px solid #007bff' : '2px solid transparent',
    color: isActive ? '#007bff' : '#666',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: isActive ? 'bold' : 'normal'
  });

  const sectionStyle = {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px'
  };

  const fieldGroupStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
    marginBottom: '15px'
  };

  return (
    <div className="container">
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={headerStyle}>My Profile</h1>
          <div>
            {!isEditing ? (
              <button className="btn" onClick={handleEdit}>
                Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
                <button className="btn" onClick={handleSave}>
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '20px',
          backgroundColor: '#007bff',
          color: 'white',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 'bold',
            marginRight: '20px'
          }}>
            {profileData.personalInfo.firstName?.[0]}{profileData.personalInfo.lastName?.[0]}
          </div>
          <div>
            <h2 style={{ margin: '0 0 5px 0' }}>
              {profileData.personalInfo.firstName} {profileData.personalInfo.lastName}
            </h2>
            <p style={{ margin: '0', opacity: 0.9 }}>
              {profileData.academicInfo.program} - {profileData.academicInfo.year}
            </p>
            <p style={{ margin: '0', opacity: 0.9 }}>
              Student ID: {profileData.academicInfo.studentId}
            </p>
          </div>
        </div>

        <div style={tabStyle}>
          <button
            style={tabButtonStyle(activeTab === 'personal')}
            onClick={() => setActiveTab('personal')}
          >
            Personal Information
          </button>
          <button
            style={tabButtonStyle(activeTab === 'academic')}
            onClick={() => setActiveTab('academic')}
          >
            Academic Information
          </button>
          <button
            style={tabButtonStyle(activeTab === 'contact')}
            onClick={() => setActiveTab('contact')}
          >
            Contact Information
          </button>
          <button
            style={tabButtonStyle(activeTab === 'preferences')}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
        </div>

        {activeTab === 'personal' && (
          <div style={sectionStyle}>
            <h3>Personal Information</h3>
            <div style={fieldGroupStyle}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="form-input"
                    value={editedData.personalInfo.firstName || ''}
                    onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                  />
                ) : (
                  <p>{profileData.personalInfo.firstName}</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="form-input"
                    value={editedData.personalInfo.lastName || ''}
                    onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                  />
                ) : (
                  <p>{profileData.personalInfo.lastName}</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                {isEditing ? (
                  <input
                    type="date"
                    className="form-input"
                    value={editedData.personalInfo.dateOfBirth || ''}
                    onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
                  />
                ) : (
                  <p>{profileData.personalInfo.dateOfBirth}</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                {isEditing ? (
                  <select
                    className="form-input"
                    value={editedData.personalInfo.gender || ''}
                    onChange={(e) => handleInputChange('personalInfo', 'gender', e.target.value)}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                ) : (
                  <p>{profileData.personalInfo.gender}</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Nationality</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="form-input"
                    value={editedData.personalInfo.nationality || ''}
                    onChange={(e) => handleInputChange('personalInfo', 'nationality', e.target.value)}
                  />
                ) : (
                  <p>{profileData.personalInfo.nationality}</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Blood Type</label>
                {isEditing ? (
                  <select
                    className="form-input"
                    value={editedData.personalInfo.bloodType || ''}
                    onChange={(e) => handleInputChange('personalInfo', 'bloodType', e.target.value)}
                  >
                    <option value="">Select Blood Type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                ) : (
                  <p>{profileData.personalInfo.bloodType}</p>
                )}
              </div>
            </div>

            <h4>Emergency Contact</h4>
            <div style={fieldGroupStyle}>
              <div className="form-group">
                <label className="form-label">Contact Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="form-input"
                    value={editedData.personalInfo.emergencyContact || ''}
                    onChange={(e) => handleInputChange('personalInfo', 'emergencyContact', e.target.value)}
                  />
                ) : (
                  <p>{profileData.personalInfo.emergencyContact}</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    className="form-input"
                    value={editedData.personalInfo.emergencyPhone || ''}
                    onChange={(e) => handleInputChange('personalInfo', 'emergencyPhone', e.target.value)}
                  />
                ) : (
                  <p>{profileData.personalInfo.emergencyPhone}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'academic' && (
          <div style={sectionStyle}>
            <h3>Academic Information</h3>
            <div style={fieldGroupStyle}>
              <div className="form-group">
                <label className="form-label">Student ID</label>
                <p>{profileData.academicInfo.studentId}</p>
              </div>
              <div className="form-group">
                <label className="form-label">Program</label>
                <p>{profileData.academicInfo.program}</p>
              </div>
              <div className="form-group">
                <label className="form-label">Current Year</label>
                <p>{profileData.academicInfo.year}</p>
              </div>
              <div className="form-group">
                <label className="form-label">Current Semester</label>
                <p>{profileData.academicInfo.semester}</p>
              </div>
              <div className="form-group">
                <label className="form-label">Academic Advisor</label>
                <p>{profileData.academicInfo.advisor}</p>
              </div>
              <div className="form-group">
                <label className="form-label">Current GPA</label>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
                  {profileData.academicInfo.gpa}
                </p>
              </div>
              <div className="form-group">
                <label className="form-label">Credits Completed</label>
                <p>{profileData.academicInfo.credits}</p>
              </div>
              <div className="form-group">
                <label className="form-label">Expected Graduation</label>
                <p>{profileData.academicInfo.expectedGraduation}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div style={sectionStyle}>
            <h3>Contact Information</h3>
            <div style={fieldGroupStyle}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    className="form-input"
                    value={editedData.contactInfo.email || ''}
                    onChange={(e) => handleInputChange('contactInfo', 'email', e.target.value)}
                  />
                ) : (
                  <p>{profileData.contactInfo.email}</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    className="form-input"
                    value={editedData.contactInfo.phone || ''}
                    onChange={(e) => handleInputChange('contactInfo', 'phone', e.target.value)}
                  />
                ) : (
                  <p>{profileData.contactInfo.phone}</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="form-input"
                    value={editedData.contactInfo.address || ''}
                    onChange={(e) => handleInputChange('contactInfo', 'address', e.target.value)}
                  />
                ) : (
                  <p>{profileData.contactInfo.address}</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="form-input"
                    value={editedData.contactInfo.city || ''}
                    onChange={(e) => handleInputChange('contactInfo', 'city', e.target.value)}
                  />
                ) : (
                  <p>{profileData.contactInfo.city}</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">State/Province</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="form-input"
                    value={editedData.contactInfo.state || ''}
                    onChange={(e) => handleInputChange('contactInfo', 'state', e.target.value)}
                  />
                ) : (
                  <p>{profileData.contactInfo.state}</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Zip/Postal Code</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="form-input"
                    value={editedData.contactInfo.zipCode || ''}
                    onChange={(e) => handleInputChange('contactInfo', 'zipCode', e.target.value)}
                  />
                ) : (
                  <p>{profileData.contactInfo.zipCode}</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="form-input"
                    value={editedData.contactInfo.country || ''}
                    onChange={(e) => handleInputChange('contactInfo', 'country', e.target.value)}
                  />
                ) : (
                  <p>{profileData.contactInfo.country}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div style={sectionStyle}>
            <h3>Account Preferences</h3>
            <div style={fieldGroupStyle}>
              <div className="form-group">
                <label className="form-label">Language</label>
                {isEditing ? (
                  <select
                    className="form-input"
                    value={editedData.preferences.language || ''}
                    onChange={(e) => handleInputChange('preferences', 'language', e.target.value)}
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                ) : (
                  <p>{profileData.preferences.language}</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Timezone</label>
                {isEditing ? (
                  <select
                    className="form-input"
                    value={editedData.preferences.timezone || ''}
                    onChange={(e) => handleInputChange('preferences', 'timezone', e.target.value)}
                  >
                    <option value="Pacific Standard Time">Pacific Standard Time</option>
                    <option value="Mountain Standard Time">Mountain Standard Time</option>
                    <option value="Central Standard Time">Central Standard Time</option>
                    <option value="Eastern Standard Time">Eastern Standard Time</option>
                  </select>
                ) : (
                  <p>{profileData.preferences.timezone}</p>
                )}
              </div>
            </div>

            <h4>Notification Preferences</h4>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isEditing ? editedData.preferences.notifications?.email : profileData.preferences.notifications?.email}
                    onChange={(e) => handleNestedInputChange('preferences', 'notifications', 'email', e.target.checked)}
                    disabled={!isEditing}
                    style={{ marginRight: '10px' }}
                  />
                  Email Notifications
                </label>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isEditing ? editedData.preferences.notifications?.sms : profileData.preferences.notifications?.sms}
                    onChange={(e) => handleNestedInputChange('preferences', 'notifications', 'sms', e.target.checked)}
                    disabled={!isEditing}
                    style={{ marginRight: '10px' }}
                  />
                  SMS Notifications
                </label>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isEditing ? editedData.preferences.notifications?.push : profileData.preferences.notifications?.push}
                    onChange={(e) => handleNestedInputChange('preferences', 'notifications', 'push', e.target.checked)}
                    disabled={!isEditing}
                    style={{ marginRight: '10px' }}
                  />
                  Push Notifications
                </label>
              </div>
            </div>

            <h4>Privacy Settings</h4>
            <div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isEditing ? editedData.preferences.privacy?.profileVisible : profileData.preferences.privacy?.profileVisible}
                    onChange={(e) => handleNestedInputChange('preferences', 'privacy', 'profileVisible', e.target.checked)}
                    disabled={!isEditing}
                    style={{ marginRight: '10px' }}
                  />
                  Make Profile Visible to Other Students
                </label>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isEditing ? editedData.preferences.privacy?.showGrades : profileData.preferences.privacy?.showGrades}
                    onChange={(e) => handleNestedInputChange('preferences', 'privacy', 'showGrades', e.target.checked)}
                    disabled={!isEditing}
                    style={{ marginRight: '10px' }}
                  />
                  Show Grades to Academic Advisors
                </label>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isEditing ? editedData.preferences.privacy?.showSchedule : profileData.preferences.privacy?.showSchedule}
                    onChange={(e) => handleNestedInputChange('preferences', 'privacy', 'showSchedule', e.target.checked)}
                    disabled={!isEditing}
                    style={{ marginRight: '10px' }}
                  />
                  Show Class Schedule to Other Students
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;