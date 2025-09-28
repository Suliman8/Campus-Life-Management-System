import React, { useState, useEffect } from 'react';

const Cafeteria = () => {
  const [menuData, setMenuData] = useState({});
  const [selectedDay, setSelectedDay] = useState('');
  const [cart, setCart] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);

  useEffect(() => {
    // Set current day
    const today = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    setSelectedDay(days[today.getDay()]);

    // Mock menu data
    const mockMenu = {
      monday: {
        breakfast: [
          { id: 1, name: 'Pancakes with Syrup', price: 8.50, category: 'Main', available: true },
          { id: 2, name: 'Fresh Orange Juice', price: 3.00, category: 'Beverage', available: true },
          { id: 3, name: 'Greek Yogurt with Berries', price: 5.50, category: 'Healthy', available: true }
        ],
        lunch: [
          { id: 4, name: 'Grilled Chicken Breast', price: 12.00, category: 'Main', available: true },
          { id: 5, name: 'Caesar Salad', price: 9.00, category: 'Salad', available: true },
          { id: 6, name: 'Vegetable Soup', price: 6.00, category: 'Soup', available: false }
        ],
        dinner: [
          { id: 7, name: 'Beef Stir Fry', price: 15.00, category: 'Main', available: true },
          { id: 8, name: 'Garlic Bread', price: 4.00, category: 'Side', available: true },
          { id: 9, name: 'Chocolate Cake', price: 6.50, category: 'Dessert', available: true }
        ]
      },
      tuesday: {
        breakfast: [
          { id: 10, name: 'Oatmeal with Fruits', price: 6.00, category: 'Healthy', available: true },
          { id: 11, name: 'Coffee', price: 2.50, category: 'Beverage', available: true },
          { id: 12, name: 'Toast with Avocado', price: 7.00, category: 'Main', available: true }
        ],
        lunch: [
          { id: 13, name: 'Fish Tacos', price: 11.50, category: 'Main', available: true },
          { id: 14, name: 'Mexican Rice', price: 5.00, category: 'Side', available: true },
          { id: 15, name: 'Fresh Salsa', price: 3.50, category: 'Side', available: true }
        ],
        dinner: [
          { id: 16, name: 'Pasta Primavera', price: 13.00, category: 'Main', available: true },
          { id: 17, name: 'Garlic Knots', price: 5.50, category: 'Side', available: true },
          { id: 18, name: 'Tiramisu', price: 7.00, category: 'Dessert', available: false }
        ]
      }
      // Add more days as needed
    };

    // Fill remaining days with similar structure
    ['wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
      mockMenu[day] = mockMenu.tuesday; // Reuse for demo
    });

    setMenuData(mockMenu);

    // Mock order history
    setOrderHistory([
      {
        id: 1,
        date: '2025-09-20',
        items: ['Grilled Chicken Breast', 'Caesar Salad'],
        total: 21.00,
        status: 'Delivered'
      },
      {
        id: 2,
        date: '2025-09-18',
        items: ['Fish Tacos', 'Mexican Rice'],
        total: 16.50,
        status: 'Delivered'
      }
    ]);
  }, []);

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    alert(`Order placed successfully! Total: $${getTotalPrice()}`);
    setCart([]);
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

  const dayButtonStyle = (isActive) => ({
    padding: '8px 16px',
    margin: '0 5px 10px 0',
    border: '1px solid #007bff',
    backgroundColor: isActive ? '#007bff' : 'white',
    color: isActive ? 'white' : '#007bff',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    textTransform: 'capitalize'
  });

  const menuItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    marginBottom: '10px',
    backgroundColor: '#f8f9fa'
  };

  const categoryColors = {
    'Main': '#007bff',
    'Side': '#28a745',
    'Beverage': '#17a2b8',
    'Dessert': '#e91e63',
    'Healthy': '#28a745',
    'Salad': '#20c997',
    'Soup': '#fd7e14'
  };

  return (
    <div className="container">
      <div style={cardStyle}>
        <h1 style={headerStyle}>Cafeteria Menu</h1>

        {/* Day Selection */}
        <div style={{ marginBottom: '20px' }}>
          <h3>Select Day:</h3>
          {Object.keys(menuData).map(day => (
            <button
              key={day}
              style={dayButtonStyle(selectedDay === day)}
              onClick={() => setSelectedDay(day)}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Menu Display */}
        {menuData[selectedDay] && (
          <div>
            {['breakfast', 'lunch', 'dinner'].map(meal => (
              <div key={meal} style={{ marginBottom: '30px' }}>
                <h3 style={{ textTransform: 'capitalize', color: '#007bff', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
                  {meal}
                </h3>
                {menuData[selectedDay][meal]?.map(item => (
                  <div key={item.id} style={menuItemStyle}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                        <h4 style={{ margin: 0 }}>{item.name}</h4>
                        <span
                          style={{
                            backgroundColor: categoryColors[item.category],
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        >
                          {item.category}
                        </span>
                        {!item.available && (
                          <span
                            style={{
                              backgroundColor: '#dc3545',
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                          >
                            Unavailable
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px', color: '#28a745' }}>
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <button
                      className="btn"
                      onClick={() => addToCart(item)}
                      disabled={!item.available}
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Order History */}
        <div style={cardStyle}>
          <h2 style={headerStyle}>Order History</h2>
          {orderHistory.length === 0 ? (
            <p>No previous orders found.</p>
          ) : (
            orderHistory.map(order => (
              <div
                key={order.id}
                style={{
                  padding: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  marginBottom: '15px',
                  backgroundColor: '#f8f9fa'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0' }}>Order #{order.id}</h4>
                    <p style={{ margin: '0', color: '#666' }}>Date: {order.date}</p>
                    <p style={{ margin: '5px 0', color: '#333' }}>
                      Items: {order.items.join(', ')}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
                      ${order.total.toFixed(2)}
                    </p>
                    <span
                      style={{
                        backgroundColor: order.status === 'Delivered' ? '#28a745' : '#ffc107',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Shopping Cart */}
        <div style={cardStyle}>
          <h2 style={headerStyle}>Shopping Cart</h2>
          {cart.length === 0 ? (
            <p>Your cart is empty</p>
          ) : (
            <>
              {cart.map(item => (
                <div
                  key={item.id}
                  style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginBottom: '10px'
                  }}
                >
                  <h5 style={{ margin: '0 0 5px 0' }}>{item.name}</h5>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>${item.price.toFixed(2)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        style={{ width: '30px', height: '30px', border: '1px solid #ddd', background: 'white' }}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        style={{ width: '30px', height: '30px', border: '1px solid #ddd', background: 'white' }}
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="btn btn-danger"
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ borderTop: '2px solid #ddd', paddingTop: '15px', marginTop: '15px' }}>
                <h3 style={{ textAlign: 'center', margin: '0 0 15px 0' }}>
                  Total: ${getTotalPrice()}
                </h3>
                <button
                  onClick={handleCheckout}
                  className="btn"
                  style={{ width: '100%' }}
                >
                  Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cafeteria;