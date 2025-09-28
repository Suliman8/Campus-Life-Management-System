# Student Portal - Campus Life Management System

A comprehensive React-based student portal for managing campus life activities, built with modern web technologies.

## Features

### Authentication
- **Login/Register**: Secure student authentication
- **Session Management**: Automatic session handling with localStorage

### Dashboard
- **Personal Overview**: Quick view of courses, grades, and attendance
- **Statistics Cards**: Visual representation of academic progress
- **Recent Activity**: Latest announcements and updates
- **Upcoming Events**: Important dates and deadlines

### Academic Management
- **Course Enrollment**: Browse and enroll in available courses
- **Grade Tracking**: View current grades and GPA
- **Attendance Monitoring**: Track attendance across all courses

### Campus Life
- **Event Management**: Browse and register for campus events
- **Cafeteria Menu**: View daily menus and place food orders
- **Library Services**: Search books, manage borrowings, and reservations
- **Payment History**: Track tuition, fees, and other payments

### Profile Management
- **Personal Information**: Update contact details and preferences
- **Academic Records**: View academic history and achievements
- **Settings**: Customize notifications and privacy settings

## Technology Stack

- **Frontend Framework**: React 18
- **Routing**: React Router DOM v6
- **Styling**: Pure CSS with CSS Grid and Flexbox
- **State Management**: React Hooks (useState, useEffect)
- **Build Tool**: Create React App
- **Containerization**: Docker with Nginx

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Docker (for containerization)

### Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```
   The application will be available at `http://localhost:3000`

3. **Build for Production**
   ```bash
   npm run build
   ```

### Docker Deployment

1. **Build Docker Image**
   ```bash
   docker build -t student-portal .
   ```

2. **Run Container**
   ```bash
   docker run -p 3000:80 student-portal
   ```
   The application will be available at `http://localhost:3000`

## Demo Credentials

For testing purposes, use these credentials:
- **Email**: student@campus.edu
- **Password**: password

## API Integration

The application is designed to work with the Campus Life Management System backend services:
- Authentication Service
- Student Service
- Course Service
- Grade Service
- Event Service
- Library Service
- Payment Service

## File Structure

```
src/
├── components/
│   └── Navbar.js           # Navigation component
├── pages/
│   ├── Login.js            # Login page
│   ├── Register.js         # Registration page
│   ├── Dashboard.js        # Main dashboard
│   ├── Courses.js          # Course management
│   ├── Events.js           # Event management
│   ├── Cafeteria.js        # Cafeteria services
│   ├── Library.js          # Library services
│   ├── Payments.js         # Payment history
│   └── Profile.js          # User profile
├── App.js                  # Main application component
├── index.js               # Application entry point
└── index.css              # Global styles
```

## Features Overview

### Responsive Design
- Mobile-first approach
- CSS Grid and Flexbox for layouts
- Responsive navigation and forms

### User Experience
- Intuitive navigation with active state indicators
- Loading states for async operations
- Form validation and error handling
- Success/error feedback for user actions

### Security Features
- JWT token management
- Protected routes
- Form input sanitization
- Secure logout functionality

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is licensed under the MIT License.