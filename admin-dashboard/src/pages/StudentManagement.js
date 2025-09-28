import React, { useState, useEffect } from 'react';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Mock student data
    const mockStudents = [
      {
        id: 1,
        studentId: 'ST001',
        name: 'John Doe',
        email: 'john.doe@campus.edu',
        phone: '+1-555-123-4567',
        program: 'Computer Science',
        year: '3rd Year',
        gpa: 3.75,
        status: 'Active',
        enrollmentDate: '2022-08-15',
        address: '123 Campus Drive, University City, CA 12345'
      },
      {
        id: 2,
        studentId: 'ST002',
        name: 'Jane Smith',
        email: 'jane.smith@campus.edu',
        phone: '+1-555-234-5678',
        program: 'Engineering',
        year: '2nd Year',
        gpa: 3.90,
        status: 'Active',
        enrollmentDate: '2023-08-15',
        address: '456 College Avenue, University City, CA 12345'
      },
      {
        id: 3,
        studentId: 'ST003',
        name: 'Mike Johnson',
        email: 'mike.johnson@campus.edu',
        phone: '+1-555-345-6789',
        program: 'Business Administration',
        year: '4th Year',
        gpa: 3.45,
        status: 'Active',
        enrollmentDate: '2021-08-15',
        address: '789 University Boulevard, University City, CA 12345'
      },
      {
        id: 4,
        studentId: 'ST004',
        name: 'Sarah Wilson',
        email: 'sarah.wilson@campus.edu',
        phone: '+1-555-456-7890',
        program: 'Arts',
        year: '1st Year',
        gpa: 3.60,
        status: 'Inactive',
        enrollmentDate: '2024-08-15',
        address: '321 Student Lane, University City, CA 12345'
      }
    ];

    setStudents(mockStudents);
    setFilteredStudents(mockStudents);
  }, []);

  useEffect(() => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.program.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(student => student.status.toLowerCase() === filterStatus);
    }

    setFilteredStudents(filtered);
  }, [students, searchTerm, filterStatus]);

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteStudent = (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      setStudents(students.filter(s => s.id !== studentId));
      alert('Student deleted successfully');
    }
  };

  const handleSaveStudent = (formData) => {
    if (selectedStudent) {
      setStudents(students.map(s =>
        s.id === selectedStudent.id ? { ...s, ...formData } : s
      ));
      alert('Student updated successfully');
    }
    setShowModal(false);
  };

  const getStatusBadge = (status) => {
    const badgeClass = status === 'Active' ? 'badge-success' : 'badge-warning';
    return <span className={`badge ${badgeClass}`}>{status}</span>;
  };

  const getGPAColor = (gpa) => {
    if (gpa >= 3.7) return '#28a745';
    if (gpa >= 3.0) return '#ffc107';
    return '#dc3545';
  };

  return (
    <div className="container">
      <div className="card">
        <div className="flex-between" style={{ marginBottom: '20px' }}>
          <h1 style={{ color: '#2c3e50' }}>Student Management</h1>
          <button className="btn btn-success">
            ➕ Add New Student
          </button>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-3" style={{ marginBottom: '20px' }}>
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-group">
            <select
              className="form-input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="form-group">
            <select className="form-input">
              <option value="">All Programs</option>
              <option value="computer-science">Computer Science</option>
              <option value="engineering">Engineering</option>
              <option value="business">Business Administration</option>
              <option value="arts">Arts</option>
            </select>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-4" style={{ marginBottom: '30px' }}>
          <div style={{
            textAlign: 'center',
            padding: '20px',
            backgroundColor: '#e3f2fd',
            borderRadius: '12px'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>
              {students.length}
            </div>
            <div style={{ color: '#1976d2', fontSize: '14px' }}>Total Students</div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: '20px',
            backgroundColor: '#e8f5e8',
            borderRadius: '12px'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#388e3c' }}>
              {students.filter(s => s.status === 'Active').length}
            </div>
            <div style={{ color: '#388e3c', fontSize: '14px' }}>Active Students</div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: '20px',
            backgroundColor: '#fff3e0',
            borderRadius: '12px'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f57c00' }}>
              {(students.reduce((acc, s) => acc + s.gpa, 0) / students.length).toFixed(2)}
            </div>
            <div style={{ color: '#f57c00', fontSize: '14px' }}>Average GPA</div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: '20px',
            backgroundColor: '#fce4ec',
            borderRadius: '12px'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#c2185b' }}>
              {new Set(students.map(s => s.program)).size}
            </div>
            <div style={{ color: '#c2185b', fontSize: '14px' }}>Programs</div>
          </div>
        </div>

        {/* Students Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Program</th>
                <th>Year</th>
                <th>GPA</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id}>
                  <td style={{ fontWeight: '500' }}>{student.studentId}</td>
                  <td>
                    <div>
                      <div style={{ fontWeight: '500' }}>{student.name}</div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>{student.email}</div>
                    </div>
                  </td>
                  <td>{student.program}</td>
                  <td>{student.year}</td>
                  <td>
                    <span style={{
                      color: getGPAColor(student.gpa),
                      fontWeight: 'bold'
                    }}>
                      {student.gpa}
                    </span>
                  </td>
                  <td>{getStatusBadge(student.status)}</td>
                  <td>
                    <div className="flex" style={{ gap: '8px' }}>
                      <button
                        className="btn"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                        onClick={() => handleViewStudent(student)}
                      >
                        👁️ View
                      </button>
                      <button
                        className="btn btn-warning"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                        onClick={() => handleEditStudent(student)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ fontSize: '12px', padding: '6px 12px' }}
                        onClick={() => handleDeleteStudent(student.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            No students found matching your search criteria.
          </div>
        )}
      </div>

      {/* Student Modal */}
      {showModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h2>{isEditing ? 'Edit Student' : 'Student Details'}</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {!isEditing ? (
              <div>
                <div className="grid grid-2" style={{ gap: '20px' }}>
                  <div>
                    <h4 style={{ color: '#495057', marginBottom: '15px' }}>Personal Information</h4>
                    <p><strong>Student ID:</strong> {selectedStudent.studentId}</p>
                    <p><strong>Name:</strong> {selectedStudent.name}</p>
                    <p><strong>Email:</strong> {selectedStudent.email}</p>
                    <p><strong>Phone:</strong> {selectedStudent.phone}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedStudent.status)}</p>
                  </div>
                  <div>
                    <h4 style={{ color: '#495057', marginBottom: '15px' }}>Academic Information</h4>
                    <p><strong>Program:</strong> {selectedStudent.program}</p>
                    <p><strong>Year:</strong> {selectedStudent.year}</p>
                    <p><strong>GPA:</strong> <span style={{ color: getGPAColor(selectedStudent.gpa), fontWeight: 'bold' }}>{selectedStudent.gpa}</span></p>
                    <p><strong>Enrollment Date:</strong> {selectedStudent.enrollmentDate}</p>
                  </div>
                </div>
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ color: '#495057', marginBottom: '10px' }}>Address</h4>
                  <p>{selectedStudent.address}</p>
                </div>
                <div className="flex" style={{ justifyContent: 'flex-end', marginTop: '30px' }}>
                  <button className="btn" onClick={() => setIsEditing(true)}>
                    Edit Student
                  </button>
                </div>
              </div>
            ) : (
              <StudentForm
                student={selectedStudent}
                onSave={handleSaveStudent}
                onCancel={() => setIsEditing(false)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StudentForm = ({ student, onSave, onCancel }) => {
  const [formData, setFormData] = useState(student);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-2" style={{ gap: '15px' }}>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input
            type="text"
            name="name"
            className="form-input"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            className="form-input"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input
            type="tel"
            name="phone"
            className="form-input"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Program</label>
          <select
            name="program"
            className="form-input"
            value={formData.program}
            onChange={handleChange}
            required
          >
            <option value="">Select Program</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Engineering">Engineering</option>
            <option value="Business Administration">Business Administration</option>
            <option value="Arts">Arts</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Year</label>
          <select
            name="year"
            className="form-input"
            value={formData.year}
            onChange={handleChange}
            required
          >
            <option value="">Select Year</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            name="status"
            className="form-input"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Address</label>
        <textarea
          name="address"
          className="form-input"
          rows="3"
          value={formData.address}
          onChange={handleChange}
          required
        />
      </div>
      <div className="flex" style={{ justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn">
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default StudentManagement;