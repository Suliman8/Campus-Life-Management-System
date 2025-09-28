import React, { useState, useEffect } from 'react';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const mockCourses = [
      {
        id: 1,
        code: 'CS101',
        name: 'Introduction to Computer Science',
        instructor: 'Dr. Smith',
        credits: 3,
        capacity: 30,
        enrolled: 25,
        schedule: 'Mon, Wed, Fri 10:00 AM',
        room: 'Room A-101',
        department: 'Computer Science',
        status: 'Active'
      },
      {
        id: 2,
        code: 'MATH201',
        name: 'Advanced Mathematics',
        instructor: 'Prof. Johnson',
        credits: 4,
        capacity: 25,
        enrolled: 20,
        schedule: 'Tue, Thu 2:00 PM',
        room: 'Room B-205',
        department: 'Mathematics',
        status: 'Active'
      },
      {
        id: 3,
        code: 'PHY101',
        name: 'Physics Fundamentals',
        instructor: 'Dr. Brown',
        credits: 3,
        capacity: 35,
        enrolled: 30,
        schedule: 'Mon, Wed 1:00 PM',
        room: 'Room C-301',
        department: 'Physics',
        status: 'Active'
      }
    ];
    setCourses(mockCourses);
  }, []);

  const getEnrollmentPercentage = (enrolled, capacity) => {
    return Math.round((enrolled / capacity) * 100);
  };

  const getStatusBadge = (status) => {
    const badgeClass = status === 'Active' ? 'badge-success' : 'badge-warning';
    return <span className={`badge ${badgeClass}`}>{status}</span>;
  };

  return (
    <div className="container">
      <div className="card">
        <div className="flex-between" style={{ marginBottom: '20px' }}>
          <h1 style={{ color: '#2c3e50' }}>Course Management</h1>
          <button className="btn btn-success">➕ Add New Course</button>
        </div>

        <div className="grid grid-4" style={{ marginBottom: '30px' }}>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '12px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>{courses.length}</div>
            <div style={{ color: '#1976d2', fontSize: '14px' }}>Total Courses</div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '12px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#388e3c' }}>
              {courses.filter(c => c.status === 'Active').length}
            </div>
            <div style={{ color: '#388e3c', fontSize: '14px' }}>Active Courses</div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fff3e0', borderRadius: '12px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f57c00' }}>
              {courses.reduce((acc, c) => acc + c.enrolled, 0)}
            </div>
            <div style={{ color: '#f57c00', fontSize: '14px' }}>Total Enrollments</div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fce4ec', borderRadius: '12px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#c2185b' }}>
              {new Set(courses.map(c => c.department)).size}
            </div>
            <div style={{ color: '#c2185b', fontSize: '14px' }}>Departments</div>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>Instructor</th>
              <th>Credits</th>
              <th>Enrollment</th>
              <th>Schedule</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(course => (
              <tr key={course.id}>
                <td style={{ fontWeight: '500' }}>{course.code}</td>
                <td>{course.name}</td>
                <td>{course.instructor}</td>
                <td>{course.credits}</td>
                <td>
                  <div>
                    <span>{course.enrolled}/{course.capacity}</span>
                    <div style={{
                      width: '100px',
                      height: '6px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '3px',
                      marginTop: '4px'
                    }}>
                      <div style={{
                        width: `${getEnrollmentPercentage(course.enrolled, course.capacity)}%`,
                        height: '100%',
                        backgroundColor: getEnrollmentPercentage(course.enrolled, course.capacity) > 80 ? '#dc3545' : '#28a745',
                        borderRadius: '3px'
                      }}></div>
                    </div>
                  </div>
                </td>
                <td>{course.schedule}</td>
                <td>{getStatusBadge(course.status)}</td>
                <td>
                  <div className="flex" style={{ gap: '8px' }}>
                    <button className="btn" style={{ fontSize: '12px', padding: '6px 12px' }}>👁️ View</button>
                    <button className="btn btn-warning" style={{ fontSize: '12px', padding: '6px 12px' }}>✏️ Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CourseManagement;