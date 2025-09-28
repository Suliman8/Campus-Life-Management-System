import React, { useState, useEffect } from 'react';

const Dashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState({
    courses: [],
    grades: [],
    attendance: {},
    upcomingEvents: [],
    announcements: []
  });

  useEffect(() => {
    // Mock API call to fetch dashboard data
    const mockData = {
      courses: [
        { id: 1, name: 'Computer Science 101', code: 'CS101', credits: 3, instructor: 'Dr. Smith' },
        { id: 2, name: 'Mathematics 201', code: 'MATH201', credits: 4, instructor: 'Prof. Johnson' },
        { id: 3, name: 'Physics 101', code: 'PHY101', credits: 3, instructor: 'Dr. Brown' },
        { id: 4, name: 'English Literature', code: 'ENG101', credits: 2, instructor: 'Ms. Davis' }
      ],
      grades: [
        { courseCode: 'CS101', courseName: 'Computer Science 101', grade: 'A', gpa: 4.0 },
        { courseCode: 'MATH201', courseName: 'Mathematics 201', grade: 'B+', gpa: 3.7 },
        { courseCode: 'PHY101', courseName: 'Physics 101', grade: 'A-', gpa: 3.7 },
        { courseCode: 'ENG101', courseName: 'English Literature', grade: 'B', gpa: 3.0 }
      ],
      attendance: {
        overall: 85,
        courses: {
          'CS101': 90,
          'MATH201': 80,
          'PHY101': 88,
          'ENG101': 82
        }
      },
      upcomingEvents: [
        { id: 1, title: 'Science Fair', date: '2025-10-15', type: 'Academic' },
        { id: 2, title: 'Cultural Night', date: '2025-10-20', type: 'Cultural' },
        { id: 3, title: 'Sports Day', date: '2025-10-25', type: 'Sports' }
      ],
      announcements: [
        { id: 1, title: 'Mid-term Exams Schedule Released', date: '2025-09-20' },
        { id: 2, title: 'Library Hours Extended', date: '2025-09-18' },
        { id: 3, title: 'New Cafeteria Menu Available', date: '2025-09-15' }
      ]
    };
    setDashboardData(mockData);
  }, []);

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

  const statCardStyle = {
    backgroundColor: '#007bff',
    color: 'white',
    textAlign: 'center',
    borderRadius: '8px',
    padding: '20px',
    margin: '10px'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  };

  return (
    <div className="container">
      <div style={cardStyle}>
        <h1 style={headerStyle}>Welcome back, {user?.name}!</h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Student ID: {user?.studentId} | Email: {user?.email}
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={gridStyle}>
        <div style={statCardStyle}>
          <h3>Enrolled Courses</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {dashboardData.courses.length}
          </p>
        </div>
        <div style={statCardStyle}>
          <h3>Overall Attendance</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {dashboardData.attendance.overall}%
          </p>
        </div>
        <div style={statCardStyle}>
          <h3>Current GPA</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {(dashboardData.grades.reduce((acc, grade) => acc + grade.gpa, 0) / dashboardData.grades.length).toFixed(2)}
          </p>
        </div>
        <div style={statCardStyle}>
          <h3>Upcoming Events</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {dashboardData.upcomingEvents.length}
          </p>
        </div>
      </div>

      {/* Current Courses */}
      <div style={cardStyle}>
        <h2 style={headerStyle}>Current Courses</h2>
        <div className="table">
          <table className="table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Credits</th>
                <th>Instructor</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.courses.map(course => (
                <tr key={course.id}>
                  <td>{course.code}</td>
                  <td>{course.name}</td>
                  <td>{course.credits}</td>
                  <td>{course.instructor}</td>
                  <td>{dashboardData.attendance.courses[course.code]}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Recent Grades */}
        <div style={cardStyle}>
          <h2 style={headerStyle}>Recent Grades</h2>
          {dashboardData.grades.map((grade, index) => (
            <div
              key={index}
              style={{
                padding: '15px',
                borderLeft: '4px solid #007bff',
                marginBottom: '10px',
                backgroundColor: '#f8f9fa'
              }}
            >
              <h4 style={{ margin: '0 0 5px 0' }}>{grade.courseCode}</h4>
              <p style={{ margin: '0', color: '#666' }}>{grade.courseName}</p>
              <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', fontSize: '18px' }}>
                Grade: {grade.grade} (GPA: {grade.gpa})
              </p>
            </div>
          ))}
        </div>

        {/* Upcoming Events */}
        <div style={cardStyle}>
          <h2 style={headerStyle}>Upcoming Events</h2>
          {dashboardData.upcomingEvents.map(event => (
            <div
              key={event.id}
              style={{
                padding: '15px',
                borderLeft: '4px solid #28a745',
                marginBottom: '10px',
                backgroundColor: '#f8f9fa'
              }}
            >
              <h4 style={{ margin: '0 0 5px 0' }}>{event.title}</h4>
              <p style={{ margin: '0', color: '#666' }}>
                {event.date} | {event.type}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Announcements */}
      <div style={cardStyle}>
        <h2 style={headerStyle}>Latest Announcements</h2>
        {dashboardData.announcements.map(announcement => (
          <div
            key={announcement.id}
            style={{
              padding: '15px',
              borderLeft: '4px solid #ffc107',
              marginBottom: '10px',
              backgroundColor: '#fff9e6'
            }}
          >
            <h4 style={{ margin: '0 0 5px 0' }}>{announcement.title}</h4>
            <p style={{ margin: '0', color: '#666' }}>Posted on: {announcement.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;