import React, { useState, useEffect } from 'react';

const EventManagement = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const mockEvents = [
      {
        id: 1,
        title: 'Science Fair 2025',
        date: '2025-10-15',
        time: '10:00 AM',
        location: 'Main Auditorium',
        type: 'Academic',
        status: 'Upcoming',
        maxAttendees: 200,
        registered: 45,
        organizer: 'Dr. Smith'
      },
      {
        id: 2,
        title: 'Cultural Night',
        date: '2025-10-20',
        time: '7:00 PM',
        location: 'Campus Theater',
        type: 'Cultural',
        status: 'Upcoming',
        maxAttendees: 300,
        registered: 120,
        organizer: 'Student Council'
      },
      {
        id: 3,
        title: 'Career Fair',
        date: '2025-11-05',
        time: '11:00 AM',
        location: 'Convention Center',
        type: 'Career',
        status: 'Active',
        maxAttendees: 1000,
        registered: 650,
        organizer: 'Career Services'
      }
    ];
    setEvents(mockEvents);
  }, []);

  const getStatusBadge = (status) => {
    const colors = {
      'Active': 'badge-success',
      'Upcoming': 'badge-warning',
      'Completed': 'badge-secondary',
      'Cancelled': 'badge-danger'
    };
    return <span className={`badge ${colors[status]}`}>{status}</span>;
  };

  const getTypeBadge = (type) => {
    const colors = {
      'Academic': '#007bff',
      'Cultural': '#e91e63',
      'Sports': '#4caf50',
      'Career': '#ff9800',
      'Workshop': '#9c27b0'
    };
    return (
      <span style={{
        backgroundColor: colors[type],
        color: 'white',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px'
      }}>
        {type}
      </span>
    );
  };

  return (
    <div className="container">
      <div className="card">
        <div className="flex-between" style={{ marginBottom: '20px' }}>
          <h1 style={{ color: '#2c3e50' }}>Event Management</h1>
          <button className="btn btn-success">➕ Create New Event</button>
        </div>

        <div className="grid grid-4" style={{ marginBottom: '30px' }}>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '12px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>{events.length}</div>
            <div style={{ color: '#1976d2', fontSize: '14px' }}>Total Events</div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fff3e0', borderRadius: '12px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f57c00' }}>
              {events.filter(e => e.status === 'Active' || e.status === 'Upcoming').length}
            </div>
            <div style={{ color: '#f57c00', fontSize: '14px' }}>Active Events</div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e8f5e8', borderRadius: '12px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#388e3c' }}>
              {events.reduce((acc, e) => acc + e.registered, 0)}
            </div>
            <div style={{ color: '#388e3c', fontSize: '14px' }}>Total Registrations</div>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fce4ec', borderRadius: '12px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#c2185b' }}>
              {new Set(events.map(e => e.type)).size}
            </div>
            <div style={{ color: '#c2185b', fontSize: '14px' }}>Event Types</div>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Date & Time</th>
              <th>Location</th>
              <th>Type</th>
              <th>Registration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event.id}>
                <td>
                  <div>
                    <div style={{ fontWeight: '500' }}>{event.title}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>By: {event.organizer}</div>
                  </div>
                </td>
                <td>
                  <div>
                    <div>{event.date}</div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>{event.time}</div>
                  </div>
                </td>
                <td>{event.location}</td>
                <td>{getTypeBadge(event.type)}</td>
                <td>
                  <div>
                    <span>{event.registered}/{event.maxAttendees}</span>
                    <div style={{
                      width: '100px',
                      height: '6px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '3px',
                      marginTop: '4px'
                    }}>
                      <div style={{
                        width: `${(event.registered / event.maxAttendees) * 100}%`,
                        height: '100%',
                        backgroundColor: event.registered === event.maxAttendees ? '#dc3545' : '#28a745',
                        borderRadius: '3px'
                      }}></div>
                    </div>
                  </div>
                </td>
                <td>{getStatusBadge(event.status)}</td>
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

export default EventManagement;