import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('enrollment');

  const reportData = {
    enrollment: [
      { month: 'Jan', students: 2400 },
      { month: 'Feb', students: 2450 },
      { month: 'Mar', students: 2500 },
      { month: 'Apr', students: 2600 },
      { month: 'May', students: 2700 },
      { month: 'Jun', students: 2750 },
      { month: 'Jul', students: 2800 },
      { month: 'Aug', students: 2850 },
      { month: 'Sep', students: 2847 }
    ],
    departments: [
      { name: 'Computer Science', students: 450, color: '#007bff' },
      { name: 'Engineering', students: 380, color: '#28a745' },
      { name: 'Business', students: 320, color: '#ffc107' },
      { name: 'Arts', students: 280, color: '#e91e63' },
      { name: 'Science', students: 350, color: '#17a2b8' }
    ],
    grades: [
      { grade: 'A+', count: 150 },
      { grade: 'A', count: 200 },
      { grade: 'B+', count: 180 },
      { grade: 'B', count: 160 },
      { grade: 'C+', count: 120 },
      { grade: 'C', count: 100 },
      { grade: 'D', count: 50 },
      { grade: 'F', count: 25 }
    ]
  };

  return (
    <div className="container">
      <div className="card">
        <h1 style={{ color: '#2c3e50', marginBottom: '20px' }}>Reports & Analytics</h1>

        <div className="flex" style={{ marginBottom: '30px', gap: '10px' }}>
          <button
            className={`btn ${selectedReport === 'enrollment' ? '' : 'btn-secondary'}`}
            onClick={() => setSelectedReport('enrollment')}
          >
            📈 Enrollment Trends
          </button>
          <button
            className={`btn ${selectedReport === 'departments' ? '' : 'btn-secondary'}`}
            onClick={() => setSelectedReport('departments')}
          >
            🏢 Department Analysis
          </button>
          <button
            className={`btn ${selectedReport === 'grades' ? '' : 'btn-secondary'}`}
            onClick={() => setSelectedReport('grades')}
          >
            📊 Grade Distribution
          </button>
          <button className="btn btn-success">📋 Export Report</button>
        </div>

        {selectedReport === 'enrollment' && (
          <div>
            <h2 style={{ color: '#495057', marginBottom: '20px' }}>Student Enrollment Trends</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={reportData.enrollment}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                <XAxis dataKey="month" stroke="#6c757d" />
                <YAxis stroke="#6c757d" />
                <Tooltip />
                <Line type="monotone" dataKey="students" stroke="#007bff" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {selectedReport === 'departments' && (
          <div>
            <h2 style={{ color: '#495057', marginBottom: '20px' }}>Department-wise Student Distribution</h2>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={reportData.departments}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="students"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {reportData.departments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {selectedReport === 'grades' && (
          <div>
            <h2 style={{ color: '#495057', marginBottom: '20px' }}>Grade Distribution Analysis</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={reportData.grades}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                <XAxis dataKey="grade" stroke="#6c757d" />
                <YAxis stroke="#6c757d" />
                <Tooltip />
                <Bar dataKey="count" fill="#28a745" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;