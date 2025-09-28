import React, { useState, useEffect } from 'react';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Mock API call
    const mockEvents = [
      {
        id: 1,
        title: 'Science Fair 2025',
        date: '2025-10-15',
        time: '10:00 AM',
        location: 'Main Auditorium',
        type: 'Academic',
        description: 'Annual science fair showcasing student projects and research.',
        maxAttendees: 200,
        registered: 45,
        image: 'https://via.placeholder.com/300x200?text=Science+Fair'
      },
      {
        id: 2,
        title: 'Cultural Night',
        date: '2025-10-20',
        time: '7:00 PM',
        location: 'Campus Theater',
        type: 'Cultural',
        description: 'Multicultural event featuring performances from different cultures.',
        maxAttendees: 300,
        registered: 120,
        image: 'https://via.placeholder.com/300x200?text=Cultural+Night'
      },
      {
        id: 3,
        title: 'Sports Day',
        date: '2025-10-25',
        time: '9:00 AM',
        location: 'Sports Complex',
        type: 'Sports',
        description: 'Annual sports competition with various indoor and outdoor games.',
        maxAttendees: 500,
        registered: 280,
        image: 'https://via.placeholder.com/300x200?text=Sports+Day'
      },
      {
        id: 4,
        title: 'Career Fair',
        date: '2025-11-05',
        time: '11:00 AM',
        location: 'Convention Center',
        type: 'Career',
        description: 'Meet with recruiters from top companies and explore career opportunities.',
        maxAttendees: 1000,
        registered: 650,
        image: 'https://via.placeholder.com/300x200?text=Career+Fair'
      },
      {
        id: 5,
        title: 'Tech Workshop: AI & ML',
        date: '2025-11-10',
        time: '2:00 PM',
        location: 'Computer Lab',
        type: 'Workshop',
        description: 'Hands-on workshop on Artificial Intelligence and Machine Learning.',
        maxAttendees: 50,
        registered: 35,
        image: 'https://via.placeholder.com/300x200?text=AI+Workshop'
      },
      {
        id: 6,
        title: 'Annual Debate Competition',
        date: '2025-11-15',
        time: '3:00 PM',
        location: 'Lecture Hall',
        type: 'Academic',
        description: 'Inter-departmental debate competition on current affairs.',
        maxAttendees: 150,
        registered: 80,
        image: 'https://via.placeholder.com/300x200?text=Debate'
      }
    ];

    setEvents(mockEvents);
    setRegisteredEvents([1, 3]); // Mock registered events
  }, []);

  const handleRegister = (eventId) => {
    setLoading(true);
    setTimeout(() => {
      if (registeredEvents.includes(eventId)) {
        setRegisteredEvents(registeredEvents.filter(id => id !== eventId));
        alert('Successfully unregistered from event');
      } else {
        setRegisteredEvents([...registeredEvents, eventId]);
        alert('Successfully registered for event');
      }
      setLoading(false);
    }, 1000);
  };

  const filteredEvents = events.filter(event =>
    filter === 'all' || event.type.toLowerCase() === filter
  );

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

  const eventCardStyle = {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    backgroundColor: 'white',
    display: 'flex',
    gap: '20px'
  };

  const filterButtonStyle = (isActive) => ({
    padding: '8px 16px',
    margin: '0 5px 10px 0',
    border: '1px solid #007bff',
    backgroundColor: isActive ? '#007bff' : 'white',
    color: isActive ? 'white' : '#007bff',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px'
  });

  const typeColors = {
    'Academic': '#007bff',
    'Cultural': '#e91e63',
    'Sports': '#4caf50',
    'Career': '#ff9800',
    'Workshop': '#9c27b0'
  };

  return (
    <div className="container">
      <div style={cardStyle}>
        <h1 style={headerStyle}>Campus Events</h1>

        {/* Filter Buttons */}
        <div style={{ marginBottom: '20px' }}>
          <button
            style={filterButtonStyle(filter === 'all')}
            onClick={() => setFilter('all')}
          >
            All Events ({events.length})
          </button>
          {['academic', 'cultural', 'sports', 'career', 'workshop'].map(type => (
            <button
              key={type}
              style={filterButtonStyle(filter === type)}
              onClick={() => setFilter(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)} ({events.filter(e => e.type.toLowerCase() === type).length})
            </button>
          ))}
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <p>No events found for the selected filter.</p>
        ) : (
          filteredEvents.map(event => (
            <div key={event.id} style={eventCardStyle}>
              <div style={{ minWidth: '200px' }}>
                <img
                  src={event.image}
                  alt={event.title}
                  style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ color: '#333', margin: '0' }}>{event.title}</h3>
                  <span
                    style={{
                      backgroundColor: typeColors[event.type],
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    {event.type}
                  </span>
                </div>

                <p style={{ color: '#666', marginBottom: '15px' }}>{event.description}</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '15px' }}>
                  <div>
                    <strong>Date:</strong> {event.date}<br />
                    <strong>Time:</strong> {event.time}
                  </div>
                  <div>
                    <strong>Location:</strong> {event.location}<br />
                    <strong>Registered:</strong> {event.registered}/{event.maxAttendees}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, backgroundColor: '#f0f0f0', borderRadius: '10px', height: '8px', marginRight: '15px' }}>
                    <div
                      style={{
                        width: `${(event.registered / event.maxAttendees) * 100}%`,
                        backgroundColor: event.registered === event.maxAttendees ? '#dc3545' : '#28a745',
                        height: '100%',
                        borderRadius: '10px'
                      }}
                    ></div>
                  </div>
                  <button
                    className={registeredEvents.includes(event.id) ? 'btn btn-danger' : 'btn'}
                    onClick={() => handleRegister(event.id)}
                    disabled={loading || (event.registered >= event.maxAttendees && !registeredEvents.includes(event.id))}
                  >
                    {loading ? 'Processing...' :
                     registeredEvents.includes(event.id) ? 'Unregister' :
                     event.registered >= event.maxAttendees ? 'Full' : 'Register'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* My Registered Events */}
      <div style={cardStyle}>
        <h2 style={headerStyle}>My Registered Events</h2>
        {registeredEvents.length === 0 ? (
          <p>You haven't registered for any events yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {events.filter(event => registeredEvents.includes(event.id)).map(event => (
              <div
                key={event.id}
                style={{
                  border: '2px solid #28a745',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: '#f8fff8'
                }}
              >
                <h4 style={{ color: '#28a745', margin: '0 0 10px 0' }}>{event.title}</h4>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  <strong>Date:</strong> {event.date} at {event.time}
                </p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  <strong>Location:</strong> {event.location}
                </p>
                <span
                  style={{
                    backgroundColor: typeColors[event.type],
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                >
                  {event.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;