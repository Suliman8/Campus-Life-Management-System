import React, { useState, useEffect } from 'react';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('enrolled');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mock API calls
    const enrolledCourses = [
      {
        id: 1,
        code: 'CS101',
        name: 'Computer Science 101',
        credits: 3,
        instructor: 'Dr. Smith',
        schedule: 'Mon, Wed, Fri 10:00 AM',
        room: 'Room A-101',
        attendance: 90,
        grade: 'A'
      },
      {
        id: 2,
        code: 'MATH201',
        name: 'Mathematics 201',
        credits: 4,
        instructor: 'Prof. Johnson',
        schedule: 'Tue, Thu 2:00 PM',
        room: 'Room B-205',
        attendance: 80,
        grade: 'B+'
      },
      {
        id: 3,
        code: 'PHY101',
        name: 'Physics 101',
        credits: 3,
        instructor: 'Dr. Brown',
        schedule: 'Mon, Wed 1:00 PM',
        room: 'Room C-301',
        attendance: 88,
        grade: 'A-'
      }
    ];

    const availableForEnrollment = [
      {
        id: 4,
        code: 'CHEM101',
        name: 'Chemistry 101',
        credits: 3,
        instructor: 'Dr. Wilson',
        schedule: 'Tue, Thu 10:00 AM',
        room: 'Room D-102',
        prerequisites: 'None',
        available: 15
      },
      {
        id: 5,
        code: 'BIO201',
        name: 'Biology 201',
        credits: 4,
        instructor: 'Prof. Garcia',
        schedule: 'Mon, Wed, Fri 2:00 PM',
        room: 'Room E-205',
        prerequisites: 'BIO101',
        available: 8
      },
      {
        id: 6,
        code: 'HIST101',
        name: 'World History',
        credits: 2,
        instructor: 'Dr. Lee',
        schedule: 'Tue 3:00 PM',
        room: 'Room F-101',
        prerequisites: 'None',
        available: 22
      }
    ];

    setCourses(enrolledCourses);
    setAvailableCourses(availableForEnrollment);
  }, []);

  const handleEnroll = (courseId) => {
    setLoading(true);
    setTimeout(() => {
      const courseToEnroll = availableCourses.find(c => c.id === courseId);
      if (courseToEnroll) {
        const newCourse = {
          ...courseToEnroll,
          attendance: 0,
          grade: 'N/A'
        };
        setCourses([...courses, newCourse]);
        setAvailableCourses(availableCourses.filter(c => c.id !== courseId));
        alert(`Successfully enrolled in ${courseToEnroll.name}`);
      }
      setLoading(false);
    }, 1000);
  };

  const handleDrop = (courseId) => {
    if (window.confirm('Are you sure you want to drop this course?')) {
      setCourses(courses.filter(c => c.id !== courseId));
      alert('Course dropped successfully');
    }
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

  const courseCardStyle = {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '15px',
    backgroundColor: '#f8f9fa'
  };

  return (
    <div className="container">
      <div style={cardStyle}>
        <h1 style={headerStyle}>Course Management</h1>

        <div style={tabStyle}>
          <button
            style={tabButtonStyle(activeTab === 'enrolled')}
            onClick={() => setActiveTab('enrolled')}
          >
            Enrolled Courses ({courses.length})
          </button>
          <button
            style={tabButtonStyle(activeTab === 'available')}
            onClick={() => setActiveTab('available')}
          >
            Available Courses ({availableCourses.length})
          </button>
        </div>

        {activeTab === 'enrolled' && (
          <div>
            <h2>Your Enrolled Courses</h2>
            {courses.length === 0 ? (
              <p>You are not enrolled in any courses yet.</p>
            ) : (
              courses.map(course => (
                <div key={course.id} style={courseCardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ color: '#007bff', margin: '0 0 10px 0' }}>
                        {course.code}: {course.name}
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                        <div>
                          <strong>Instructor:</strong> {course.instructor}<br />
                          <strong>Credits:</strong> {course.credits}<br />
                          <strong>Schedule:</strong> {course.schedule}
                        </div>
                        <div>
                          <strong>Room:</strong> {course.room}<br />
                          <strong>Attendance:</strong> {course.attendance}%<br />
                          <strong>Current Grade:</strong> {course.grade}
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDrop(course.id)}
                      style={{ marginLeft: '15px' }}
                    >
                      Drop Course
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'available' && (
          <div>
            <h2>Available for Enrollment</h2>
            {availableCourses.length === 0 ? (
              <p>No courses available for enrollment at this time.</p>
            ) : (
              availableCourses.map(course => (
                <div key={course.id} style={courseCardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ color: '#28a745', margin: '0 0 10px 0' }}>
                        {course.code}: {course.name}
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                        <div>
                          <strong>Instructor:</strong> {course.instructor}<br />
                          <strong>Credits:</strong> {course.credits}<br />
                          <strong>Schedule:</strong> {course.schedule}
                        </div>
                        <div>
                          <strong>Room:</strong> {course.room}<br />
                          <strong>Prerequisites:</strong> {course.prerequisites}<br />
                          <strong>Spots Available:</strong> {course.available}
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn"
                      onClick={() => handleEnroll(course.id)}
                      disabled={loading}
                      style={{ marginLeft: '15px' }}
                    >
                      {loading ? 'Enrolling...' : 'Enroll'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Course Statistics */}
      <div style={cardStyle}>
        <h2 style={headerStyle}>Academic Summary</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
            <h3 style={{ color: '#1976d2' }}>Total Credits</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: '#1976d2' }}>
              {courses.reduce((total, course) => total + course.credits, 0)}
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
            <h3 style={{ color: '#388e3c' }}>Average Attendance</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: '#388e3c' }}>
              {courses.length > 0 ? Math.round(courses.reduce((total, course) => total + course.attendance, 0) / courses.length) : 0}%
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
            <h3 style={{ color: '#f57c00' }}>Enrolled Courses</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: '#f57c00' }}>
              {courses.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Courses;