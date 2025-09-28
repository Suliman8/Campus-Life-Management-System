import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const Dashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalStudents: 0,
      totalCourses: 0,
      totalFaculty: 0,
      activeEvents: 0
    },
    recentActivity: [],
    enrollmentData: [],
    gradeDistribution: [],
    systemHealth: {}
  });

  useEffect(() => {
    // Mock dashboard data
    const mockData = {
      stats: {
        totalStudents: 2847,
        totalCourses: 156,
        totalFaculty: 89,
        activeEvents: 12
      },
      recentActivity: [
        { id: 1, type: 'enrollment', message: 'John Doe enrolled in Computer Science 101', time: '2 minutes ago' },
        { id: 2, type: 'grade', message: 'Grade submitted for Mathematics 201', time: '15 minutes ago' },
        { id: 3, type: 'event', message: 'Science Fair event created', time: '1 hour ago' },
        { id: 4, type: 'user', message: 'New student registration: Jane Smith', time: '2 hours ago' },
        { id: 5, type: 'system', message: 'Database backup completed', time: '3 hours ago' }
      ],
      enrollmentData: [
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
      gradeDistribution: [
        { name: 'A', value: 25, color: '#28a745' },
        { name: 'B', value: 35, color: '#17a2b8' },
        { name: 'C', value: 25, color: '#ffc107' },
        { name: 'D', value: 10, color: '#fd7e14' },
        { name: 'F', value: 5, color: '#dc3545' }
      ],
      systemHealth: {
        serverStatus: 'Online',
        databaseStatus: 'Healthy',
        apiResponseTime: '120ms',
        uptime: '99.9%'
      }
    };

    setDashboardData(mockData);
  }, []);

  const statsCardStyle = (gradient) => ({
    background: gradient,
    color: 'white',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
  });

  const activityTypeColors = {
    enrollment: '#007bff',
    grade: '#28a745',
    event: '#ffc107',
    user: '#17a2b8',
    system: '#6c757d'
  };

  const activityTypeIcons = {
    enrollment: '📚',
    grade: '📝',
    event: '🎉',
    user: '👤',
    system: '⚙️'
  };

  return (
    <div className="container">
      <div className="card">
        <h1 style={{ color: '#2c3e50', marginBottom: '8px' }}>Dashboard Overview</h1>
        <p style={{ color: '#7f8c8d', fontSize: '16px' }}>
          Welcome back, {user?.name}! Here's what's happening in your campus today.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-4" style={{ marginBottom: '30px' }}>
        <div style={statsCardStyle('linear-gradient(135deg, #667eea 0%, #764ba2 100%)')}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>👥</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '4px' }}>
            {dashboardData.stats.totalStudents.toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Students</div>
        </div>

        <div style={statsCardStyle('linear-gradient(135deg, #f093fb 0%, #f5576c 100%)')}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>📚</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '4px' }}>
            {dashboardData.stats.totalCourses}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Active Courses</div>
        </div>

        <div style={statsCardStyle('linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)')}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>👨‍🏫</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '4px' }}>
            {dashboardData.stats.totalFaculty}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Faculty Members</div>
        </div>

        <div style={statsCardStyle('linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)')}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🎉</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '4px' }}>
            {dashboardData.stats.activeEvents}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Active Events</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '30px' }}>
        {/* Enrollment Trend Chart */}
        <div className="card">
          <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Student Enrollment Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.enrollmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
              <XAxis dataKey="month" stroke="#6c757d" />
              <YAxis stroke="#6c757d" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="students"
                stroke="#667eea"
                strokeWidth={3}
                dot={{ fill: '#667eea', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#764ba2' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Grade Distribution Chart */}
        <div className="card">
          <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Grade Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData.gradeDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {dashboardData.gradeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '15px', marginTop: '15px' }}>
            {dashboardData.gradeDistribution.map((grade, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: grade.color,
                    borderRadius: '50%'
                  }}
                ></div>
                <span style={{ fontSize: '14px', color: '#495057' }}>
                  Grade {grade.name}: {grade.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Recent Activity */}
        <div className="card">
          <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Recent Activity</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {dashboardData.recentActivity.map(activity => (
              <div
                key={activity.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '15px',
                  borderLeft: `4px solid ${activityTypeColors[activity.type]}`,
                  backgroundColor: '#f8f9fa',
                  marginBottom: '12px',
                  borderRadius: '0 8px 8px 0'
                }}
              >
                <div style={{ fontSize: '20px', marginRight: '15px' }}>
                  {activityTypeIcons[activity.type]}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px 0', color: '#495057', fontSize: '14px' }}>
                    {activity.message}
                  </p>
                  <small style={{ color: '#6c757d' }}>{activity.time}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="card">
          <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>System Health</h2>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '15px',
              backgroundColor: '#e8f5e8',
              borderRadius: '8px',
              border: '1px solid #c3e6cb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ fontSize: '20px', marginRight: '12px' }}>🖥️</div>
                <span style={{ fontWeight: '500', color: '#155724' }}>Server Status</span>
              </div>
              <span className="badge badge-success">{dashboardData.systemHealth.serverStatus}</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '15px',
              backgroundColor: '#e8f5e8',
              borderRadius: '8px',
              border: '1px solid #c3e6cb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ fontSize: '20px', marginRight: '12px' }}>🗄️</div>
                <span style={{ fontWeight: '500', color: '#155724' }}>Database Status</span>
              </div>
              <span className="badge badge-success">{dashboardData.systemHealth.databaseStatus}</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '15px',
              backgroundColor: '#fff3cd',
              borderRadius: '8px',
              border: '1px solid #ffeaa7'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ fontSize: '20px', marginRight: '12px' }}>⚡</div>
                <span style={{ fontWeight: '500', color: '#856404' }}>API Response Time</span>
              </div>
              <span className="badge badge-warning">{dashboardData.systemHealth.apiResponseTime}</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '15px',
              backgroundColor: '#e8f5e8',
              borderRadius: '8px',
              border: '1px solid #c3e6cb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ fontSize: '20px', marginRight: '12px' }}>📈</div>
                <span style={{ fontWeight: '500', color: '#155724' }}>System Uptime</span>
              </div>
              <span className="badge badge-success">{dashboardData.systemHealth.uptime}</span>
            </div>
          </div>

          <div style={{ marginTop: '25px', textAlign: 'center' }}>
            <button className="btn btn-success" style={{ marginRight: '10px' }}>
              📊 View Detailed Analytics
            </button>
            <button className="btn btn-secondary">
              🔄 Refresh Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;