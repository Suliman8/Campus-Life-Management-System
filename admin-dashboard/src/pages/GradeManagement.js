import React, { useState, useEffect } from 'react';

const GradeManagement = () => {
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    const mockGrades = [
      { id: 1, studentId: 'ST001', studentName: 'John Doe', course: 'CS101', assignment: 'Midterm Exam', grade: 'A', points: 95, maxPoints: 100, date: '2025-09-15' },
      { id: 2, studentId: 'ST002', studentName: 'Jane Smith', course: 'MATH201', assignment: 'Quiz 1', grade: 'A+', points: 98, maxPoints: 100, date: '2025-09-10' },
      { id: 3, studentId: 'ST001', studentName: 'John Doe', course: 'PHY101', assignment: 'Lab Report', grade: 'B+', points: 87, maxPoints: 100, date: '2025-09-12' }
    ];
    setGrades(mockGrades);
  }, []);

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return '#28a745';
    if (grade.startsWith('B')) return '#17a2b8';
    if (grade.startsWith('C')) return '#ffc107';
    return '#dc3545';
  };

  return (
    <div className="container">
      <div className="card">
        <h1 style={{ color: '#2c3e50', marginBottom: '20px' }}>Grade Management</h1>

        <div className="grid grid-4" style={{ marginBottom: '30px' }}>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '12px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
              {grades.filter(g => g.grade.startsWith('A')).length}
            </div>
            <div style={{ color: '#28a745', fontSize: '14px' }}>A Grades</div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '12px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#17a2b8' }}>
              {grades.filter(g => g.grade.startsWith('B')).length}
            </div>
            <div style={{ color: '#17a2b8', fontSize: '14px' }}>B Grades</div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fff3e0', borderRadius: '12px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
              {Math.round(grades.reduce((acc, g) => acc + g.points, 0) / grades.length)}
            </div>
            <div style={{ color: '#ffc107', fontSize: '14px' }}>Average Score</div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fce4ec', borderRadius: '12px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#c2185b' }}>{grades.length}</div>
            <div style={{ color: '#c2185b', fontSize: '14px' }}>Total Grades</div>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Assignment</th>
              <th>Grade</th>
              <th>Score</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {grades.map(grade => (
              <tr key={grade.id}>
                <td>
                  <div>
                    <div style={{ fontWeight: '500' }}>{grade.studentName}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>{grade.studentId}</div>
                  </div>
                </td>
                <td>{grade.course}</td>
                <td>{grade.assignment}</td>
                <td>
                  <span style={{ color: getGradeColor(grade.grade), fontWeight: 'bold', fontSize: '16px' }}>
                    {grade.grade}
                  </span>
                </td>
                <td>{grade.points}/{grade.maxPoints}</td>
                <td>{grade.date}</td>
                <td>
                  <button className="btn btn-warning" style={{ fontSize: '12px', padding: '6px 12px' }}>
                    ✏️ Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GradeManagement;