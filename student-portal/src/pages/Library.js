import React, { useState, useEffect } from 'react';

const Library = () => {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState('title');
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [activeTab, setActiveTab] = useState('search');

  useEffect(() => {
    // Mock book data
    const mockBooks = [
      {
        id: 1,
        title: 'Introduction to Computer Science',
        author: 'John Smith',
        isbn: '978-1234567890',
        category: 'Computer Science',
        available: 5,
        total: 10,
        location: 'CS Section - Floor 2',
        description: 'Comprehensive guide to computer science fundamentals.',
        publishYear: 2022
      },
      {
        id: 2,
        title: 'Advanced Mathematics',
        author: 'Mary Johnson',
        isbn: '978-0987654321',
        category: 'Mathematics',
        available: 3,
        total: 8,
        location: 'Math Section - Floor 3',
        description: 'Advanced mathematical concepts and applications.',
        publishYear: 2021
      },
      {
        id: 3,
        title: 'Physics: Principles and Applications',
        author: 'David Brown',
        isbn: '978-1122334455',
        category: 'Physics',
        available: 0,
        total: 6,
        location: 'Science Section - Floor 2',
        description: 'Fundamental physics principles with real-world applications.',
        publishYear: 2023
      },
      {
        id: 4,
        title: 'Modern Literature Analysis',
        author: 'Sarah Wilson',
        isbn: '978-5566778899',
        category: 'Literature',
        available: 7,
        total: 12,
        location: 'Literature Section - Floor 1',
        description: 'Analysis of contemporary literary works.',
        publishYear: 2020
      },
      {
        id: 5,
        title: 'Data Structures and Algorithms',
        author: 'Robert Davis',
        isbn: '978-9988776655',
        category: 'Computer Science',
        available: 2,
        total: 15,
        location: 'CS Section - Floor 2',
        description: 'Comprehensive guide to data structures and algorithmic thinking.',
        publishYear: 2023
      },
      {
        id: 6,
        title: 'World History: Ancient to Modern',
        author: 'Emily Garcia',
        isbn: '978-4433221100',
        category: 'History',
        available: 4,
        total: 8,
        location: 'History Section - Floor 1',
        description: 'Comprehensive overview of world history from ancient times to present.',
        publishYear: 2022
      }
    ];

    setBooks(mockBooks);

    // Mock borrowed books
    setBorrowedBooks([
      {
        id: 1,
        bookId: 2,
        title: 'Advanced Mathematics',
        author: 'Mary Johnson',
        borrowDate: '2025-09-15',
        dueDate: '2025-10-15',
        status: 'Borrowed',
        renewalsLeft: 2
      }
    ]);

    // Mock reservations
    setReservations([
      {
        id: 1,
        bookId: 3,
        title: 'Physics: Principles and Applications',
        author: 'David Brown',
        reservationDate: '2025-09-20',
        status: 'Reserved',
        position: 1
      }
    ]);
  }, []);

  const filteredBooks = books.filter(book => {
    const searchValue = book[searchFilter].toLowerCase();
    return searchValue.includes(searchTerm.toLowerCase());
  });

  const handleBorrow = (book) => {
    if (book.available > 0) {
      const newBorrowedBook = {
        id: Date.now(),
        bookId: book.id,
        title: book.title,
        author: book.author,
        borrowDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Borrowed',
        renewalsLeft: 3
      };
      setBorrowedBooks([...borrowedBooks, newBorrowedBook]);
      setBooks(books.map(b => b.id === book.id ? { ...b, available: b.available - 1 } : b));
      alert(`Successfully borrowed "${book.title}"`);
    }
  };

  const handleReserve = (book) => {
    if (book.available === 0) {
      const newReservation = {
        id: Date.now(),
        bookId: book.id,
        title: book.title,
        author: book.author,
        reservationDate: new Date().toISOString().split('T')[0],
        status: 'Reserved',
        position: 1 // In a real app, this would be calculated
      };
      setReservations([...reservations, newReservation]);
      alert(`Successfully reserved "${book.title}"`);
    }
  };

  const handleReturn = (borrowedBookId) => {
    const borrowedBook = borrowedBooks.find(b => b.id === borrowedBookId);
    if (borrowedBook) {
      setBorrowedBooks(borrowedBooks.filter(b => b.id !== borrowedBookId));
      setBooks(books.map(b => b.id === borrowedBook.bookId ? { ...b, available: b.available + 1 } : b));
      alert(`Successfully returned "${borrowedBook.title}"`);
    }
  };

  const handleRenew = (borrowedBookId) => {
    setBorrowedBooks(borrowedBooks.map(b => {
      if (b.id === borrowedBookId && b.renewalsLeft > 0) {
        const newDueDate = new Date(b.dueDate);
        newDueDate.setDate(newDueDate.getDate() + 14);
        return {
          ...b,
          dueDate: newDueDate.toISOString().split('T')[0],
          renewalsLeft: b.renewalsLeft - 1
        };
      }
      return b;
    }));
    alert('Book renewed for 14 more days');
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

  const bookCardStyle = {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '15px',
    backgroundColor: '#f8f9fa'
  };

  const categoryColors = {
    'Computer Science': '#007bff',
    'Mathematics': '#28a745',
    'Physics': '#17a2b8',
    'Literature': '#e91e63',
    'History': '#fd7e14'
  };

  return (
    <div className="container">
      <div style={cardStyle}>
        <h1 style={headerStyle}>Library Management</h1>

        <div style={tabStyle}>
          <button
            style={tabButtonStyle(activeTab === 'search')}
            onClick={() => setActiveTab('search')}
          >
            Search Books
          </button>
          <button
            style={tabButtonStyle(activeTab === 'borrowed')}
            onClick={() => setActiveTab('borrowed')}
          >
            Borrowed Books ({borrowedBooks.length})
          </button>
          <button
            style={tabButtonStyle(activeTab === 'reserved')}
            onClick={() => setActiveTab('reserved')}
          >
            Reservations ({reservations.length})
          </button>
        </div>

        {activeTab === 'search' && (
          <div>
            {/* Search Section */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'center' }}>
                <select
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="form-input"
                  style={{ width: '150px' }}
                >
                  <option value="title">Title</option>
                  <option value="author">Author</option>
                  <option value="category">Category</option>
                  <option value="isbn">ISBN</option>
                </select>
                <input
                  type="text"
                  placeholder={`Search by ${searchFilter}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            {/* Books List */}
            <div>
              <h3>Available Books ({filteredBooks.length})</h3>
              {filteredBooks.length === 0 ? (
                <p>No books found matching your search criteria.</p>
              ) : (
                filteredBooks.map(book => (
                  <div key={book.id} style={bookCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                          <h3 style={{ color: '#333', margin: 0 }}>{book.title}</h3>
                          <span
                            style={{
                              backgroundColor: categoryColors[book.category],
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            {book.category}
                          </span>
                          <span
                            style={{
                              backgroundColor: book.available > 0 ? '#28a745' : '#dc3545',
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px'
                            }}
                          >
                            {book.available > 0 ? `${book.available} Available` : 'Not Available'}
                          </span>
                        </div>

                        <p style={{ margin: '5px 0', color: '#666' }}>
                          <strong>Author:</strong> {book.author}
                        </p>
                        <p style={{ margin: '5px 0', color: '#666' }}>
                          <strong>ISBN:</strong> {book.isbn} | <strong>Published:</strong> {book.publishYear}
                        </p>
                        <p style={{ margin: '5px 0', color: '#666' }}>
                          <strong>Location:</strong> {book.location}
                        </p>
                        <p style={{ margin: '10px 0', color: '#333' }}>{book.description}</p>
                        <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                          Total Copies: {book.total} | Available: {book.available}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginLeft: '15px' }}>
                        {book.available > 0 ? (
                          <button
                            className="btn"
                            onClick={() => handleBorrow(book)}
                          >
                            Borrow
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleReserve(book)}
                          >
                            Reserve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'borrowed' && (
          <div>
            <h2>My Borrowed Books</h2>
            {borrowedBooks.length === 0 ? (
              <p>You haven't borrowed any books yet.</p>
            ) : (
              borrowedBooks.map(book => (
                <div key={book.id} style={bookCardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 5px 0' }}>{book.title}</h4>
                      <p style={{ margin: '0', color: '#666' }}>by {book.author}</p>
                      <p style={{ margin: '5px 0', fontSize: '14px' }}>
                        <strong>Borrowed:</strong> {book.borrowDate} | <strong>Due:</strong> {book.dueDate}
                      </p>
                      <p style={{ margin: '0', fontSize: '14px', color: '#007bff' }}>
                        Renewals Left: {book.renewalsLeft}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleRenew(book.id)}
                        disabled={book.renewalsLeft === 0}
                      >
                        Renew
                      </button>
                      <button
                        className="btn"
                        onClick={() => handleReturn(book.id)}
                      >
                        Return
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'reserved' && (
          <div>
            <h2>My Reservations</h2>
            {reservations.length === 0 ? (
              <p>You have no active reservations.</p>
            ) : (
              reservations.map(reservation => (
                <div key={reservation.id} style={bookCardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 5px 0' }}>{reservation.title}</h4>
                      <p style={{ margin: '0', color: '#666' }}>by {reservation.author}</p>
                      <p style={{ margin: '5px 0', fontSize: '14px' }}>
                        <strong>Reserved:</strong> {reservation.reservationDate}
                      </p>
                      <p style={{ margin: '0', fontSize: '14px', color: '#ffc107' }}>
                        Position in queue: {reservation.position}
                      </p>
                    </div>
                    <span
                      style={{
                        backgroundColor: '#ffc107',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      {reservation.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Library Information */}
      <div style={cardStyle}>
        <h2 style={headerStyle}>Library Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <h4>Opening Hours</h4>
            <p>Monday - Friday: 8:00 AM - 10:00 PM<br />
               Saturday - Sunday: 9:00 AM - 8:00 PM</p>
          </div>
          <div>
            <h4>Borrowing Policy</h4>
            <p>Loan Period: 30 days<br />
               Renewals: Up to 3 times<br />
               Maximum Books: 5 per student</p>
          </div>
          <div>
            <h4>Contact Information</h4>
            <p>Phone: (555) 123-4567<br />
               Email: library@campus.edu<br />
               Location: Building A, Floor 1</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Library;