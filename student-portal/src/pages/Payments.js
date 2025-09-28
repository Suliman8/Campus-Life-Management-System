import React, { useState, useEffect } from 'react';

const Payments = () => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');

  useEffect(() => {
    // Mock payment data
    const mockPendingPayments = [
      {
        id: 1,
        description: 'Fall 2025 Tuition Fee',
        amount: 2500.00,
        dueDate: '2025-10-15',
        type: 'Tuition',
        status: 'Pending',
        priority: 'High'
      },
      {
        id: 2,
        description: 'Library Late Fee',
        amount: 15.00,
        dueDate: '2025-09-30',
        type: 'Fine',
        status: 'Pending',
        priority: 'Medium'
      },
      {
        id: 3,
        description: 'Cafeteria Balance',
        amount: 45.50,
        dueDate: '2025-10-01',
        type: 'Cafeteria',
        status: 'Pending',
        priority: 'Low'
      },
      {
        id: 4,
        description: 'Lab Equipment Fee',
        amount: 75.00,
        dueDate: '2025-10-10',
        type: 'Lab Fee',
        status: 'Pending',
        priority: 'Medium'
      }
    ];

    const mockPaymentHistory = [
      {
        id: 101,
        description: 'Spring 2025 Tuition Fee',
        amount: 2500.00,
        paymentDate: '2025-02-15',
        method: 'Credit Card',
        type: 'Tuition',
        status: 'Completed',
        transactionId: 'TXN123456789'
      },
      {
        id: 102,
        description: 'Parking Permit',
        amount: 150.00,
        paymentDate: '2025-08-20',
        method: 'Bank Transfer',
        type: 'Permit',
        status: 'Completed',
        transactionId: 'TXN987654321'
      },
      {
        id: 103,
        description: 'Student Activity Fee',
        amount: 100.00,
        paymentDate: '2025-09-01',
        method: 'Debit Card',
        type: 'Activity',
        status: 'Completed',
        transactionId: 'TXN456789123'
      },
      {
        id: 104,
        description: 'Cafeteria Top-up',
        amount: 200.00,
        paymentDate: '2025-09-10',
        method: 'Credit Card',
        type: 'Cafeteria',
        status: 'Completed',
        transactionId: 'TXN789123456'
      }
    ];

    setPendingPayments(mockPendingPayments);
    setPaymentHistory(mockPaymentHistory);
  }, []);

  const handlePayment = (payment) => {
    setSelectedPayment(payment);
  };

  const processPayment = () => {
    if (selectedPayment) {
      // Mock payment processing
      const newPayment = {
        ...selectedPayment,
        id: Date.now(),
        paymentDate: new Date().toISOString().split('T')[0],
        method: paymentMethod === 'card' ? 'Credit Card' : 'Bank Transfer',
        status: 'Completed',
        transactionId: `TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      };

      setPaymentHistory([newPayment, ...paymentHistory]);
      setPendingPayments(pendingPayments.filter(p => p.id !== selectedPayment.id));
      setSelectedPayment(null);
      alert(`Payment of $${selectedPayment.amount.toFixed(2)} processed successfully!`);
    }
  };

  const getTotalPending = () => {
    return pendingPayments.reduce((total, payment) => total + payment.amount, 0);
  };

  const getTotalPaid = () => {
    return paymentHistory.reduce((total, payment) => total + payment.amount, 0);
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

  const paymentCardStyle = {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '15px',
    backgroundColor: '#f8f9fa'
  };

  const priorityColors = {
    'High': '#dc3545',
    'Medium': '#ffc107',
    'Low': '#28a745'
  };

  const typeColors = {
    'Tuition': '#007bff',
    'Fine': '#dc3545',
    'Cafeteria': '#28a745',
    'Lab Fee': '#17a2b8',
    'Permit': '#6c757d',
    'Activity': '#e91e63'
  };

  return (
    <div className="container">
      <div style={cardStyle}>
        <h1 style={headerStyle}>Payment Management</h1>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
            <h3 style={{ color: '#856404' }}>Total Pending</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: '#856404' }}>
              ${getTotalPending().toFixed(2)}
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#d4edda', borderRadius: '8px', border: '1px solid #c3e6cb' }}>
            <h3 style={{ color: '#155724' }}>Total Paid This Year</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: '#155724' }}>
              ${getTotalPaid().toFixed(2)}
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#cce5ff', borderRadius: '8px', border: '1px solid #b3d7ff' }}>
            <h3 style={{ color: '#004085' }}>Pending Items</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0', color: '#004085' }}>
              {pendingPayments.length}
            </p>
          </div>
        </div>

        <div style={tabStyle}>
          <button
            style={tabButtonStyle(activeTab === 'pending')}
            onClick={() => setActiveTab('pending')}
          >
            Pending Payments ({pendingPayments.length})
          </button>
          <button
            style={tabButtonStyle(activeTab === 'history')}
            onClick={() => setActiveTab('history')}
          >
            Payment History ({paymentHistory.length})
          </button>
        </div>

        {activeTab === 'pending' && (
          <div>
            <h2>Outstanding Payments</h2>
            {pendingPayments.length === 0 ? (
              <p>No pending payments. Great job staying up to date!</p>
            ) : (
              <>
                {pendingPayments.map(payment => (
                  <div key={payment.id} style={paymentCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                          <h3 style={{ color: '#333', margin: 0 }}>{payment.description}</h3>
                          <span
                            style={{
                              backgroundColor: typeColors[payment.type],
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            {payment.type}
                          </span>
                          <span
                            style={{
                              backgroundColor: priorityColors[payment.priority],
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px'
                            }}
                          >
                            {payment.priority} Priority
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                          <div>
                            <p style={{ margin: '5px 0', fontSize: '18px', fontWeight: 'bold', color: '#dc3545' }}>
                              Amount: ${payment.amount.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p style={{ margin: '5px 0', color: '#666' }}>
                              <strong>Due Date:</strong> {payment.dueDate}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        className="btn"
                        onClick={() => handlePayment(payment)}
                        style={{ marginLeft: '15px' }}
                      >
                        Pay Now
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h2>Payment History</h2>
            {paymentHistory.length === 0 ? (
              <p>No payment history available.</p>
            ) : (
              paymentHistory.map(payment => (
                <div key={payment.id} style={paymentCardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                        <h3 style={{ color: '#333', margin: 0 }}>{payment.description}</h3>
                        <span
                          style={{
                            backgroundColor: typeColors[payment.type],
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          {payment.type}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                        <div>
                          <p style={{ margin: '5px 0', fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>
                            ${payment.amount.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: '5px 0', color: '#666' }}>
                            <strong>Date:</strong> {payment.paymentDate}
                          </p>
                          <p style={{ margin: '0', color: '#666' }}>
                            <strong>Method:</strong> {payment.method}
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: '5px 0', color: '#666' }}>
                            <strong>Transaction ID:</strong> {payment.transactionId}
                          </p>
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        marginLeft: '15px'
                      }}
                    >
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {selectedPayment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2>Payment Details</h2>
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Description:</strong> {selectedPayment.description}</p>
              <p><strong>Amount:</strong> ${selectedPayment.amount.toFixed(2)}</p>
              <p><strong>Due Date:</strong> {selectedPayment.dueDate}</p>
              <p><strong>Type:</strong> {selectedPayment.type}</p>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="form-input"
              >
                <option value="card">Credit/Debit Card</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            {paymentMethod === 'card' && (
              <div>
                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="1234 5678 9012 3456"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVV</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedPayment(null)}
              >
                Cancel
              </button>
              <button
                className="btn"
                onClick={processPayment}
              >
                Pay ${selectedPayment.amount.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;