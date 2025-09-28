# Admin Dashboard - Campus Life Management System

A powerful React-based administrative dashboard for managing campus operations, built with modern web technologies and data visualization components.

## Features

### Authentication & Authorization
- **Secure Admin Login**: Role-based authentication system
- **Multiple Admin Levels**: System Admin, Faculty Admin, Department Admin
- **Session Management**: Secure token-based authentication

### Analytics Dashboard
- **Real-time Statistics**: Student enrollment, course analytics, system health
- **Data Visualization**: Charts and graphs using Recharts library
- **Performance Metrics**: System uptime, response times, and health monitoring
- **Activity Tracking**: Recent system activities and user actions

### Student Management
- **Student Database**: Comprehensive student information management
- **Search & Filter**: Advanced search capabilities by name, ID, program, status
- **Academic Records**: GPA tracking, enrollment history, status management
- **Profile Management**: Complete student profile editing and maintenance

### Course Management
- **Course Catalog**: Manage course offerings and scheduling
- **Enrollment Tracking**: Monitor course capacity and student registration
- **Instructor Assignment**: Faculty and course coordination
- **Department Organization**: Course categorization and management

### Grade Management
- **Grade Entry**: Efficient grade input and modification system
- **Grade Analytics**: Distribution analysis and performance tracking
- **Bulk Operations**: Mass grade updates and imports
- **Academic Reports**: Comprehensive grade reporting

### Event Management
- **Campus Events**: Create, manage, and monitor campus events
- **Registration Tracking**: Monitor event attendance and capacity
- **Event Categories**: Academic, cultural, sports, career events
- **Calendar Integration**: Event scheduling and conflict management

### Reports & Analytics
- **Enrollment Trends**: Historical enrollment data and projections
- **Performance Analytics**: Academic performance across departments
- **System Reports**: Usage statistics and performance metrics
- **Export Capabilities**: Data export in multiple formats

### System Settings
- **Profile Management**: Admin profile and preferences
- **System Configuration**: Global system settings and parameters
- **Security Settings**: Authentication, session, and access controls
- **Maintenance Mode**: System maintenance and update controls

## Technology Stack

- **Frontend Framework**: React 18
- **Routing**: React Router DOM v6
- **Data Visualization**: Recharts for charts and graphs
- **Styling**: Modern CSS with CSS Grid and Flexbox
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
   docker build -t admin-dashboard .
   ```

2. **Run Container**
   ```bash
   docker run -p 3001:80 admin-dashboard
   ```
   The application will be available at `http://localhost:3001`

## Demo Credentials

### System Administrator
- **Email**: admin@campus.edu
- **Password**: admin123
- **Access**: Full system access and configuration

### Faculty Administrator
- **Email**: faculty@campus.edu
- **Password**: faculty123
- **Access**: Academic management (courses, grades, students)

## Architecture Overview

### Component Structure
- **Layout Components**: Sidebar navigation and main content area
- **Page Components**: Full-screen application pages
- **Shared Components**: Reusable UI elements and forms
- **Chart Components**: Data visualization elements

### State Management
- **Local State**: React hooks for component-level state
- **Session State**: Authentication and user data management
- **API Integration**: Mock services with realistic data patterns

## File Structure

```
src/
├── components/
│   └── Sidebar.js              # Navigation sidebar
├── pages/
│   ├── Login.js                # Admin login page
│   ├── Dashboard.js            # Main analytics dashboard
│   ├── StudentManagement.js    # Student administration
│   ├── CourseManagement.js     # Course administration
│   ├── GradeManagement.js      # Grade administration
│   ├── EventManagement.js      # Event administration
│   ├── Reports.js              # Reports and analytics
│   └── Settings.js             # System settings
├── App.js                      # Main application component
├── index.js                   # Application entry point
└── index.css                  # Global styles and theme
```

## Key Features

### Data Visualization
- **Interactive Charts**: Line charts, bar charts, pie charts
- **Real-time Updates**: Dynamic data refresh capabilities
- **Responsive Charts**: Mobile-friendly chart rendering
- **Export Options**: Chart data export functionality

### User Experience
- **Intuitive Interface**: Clean, professional administrative interface
- **Responsive Design**: Works seamlessly across desktop and tablet devices
- **Fast Navigation**: Quick access to all administrative functions
- **Search & Filter**: Advanced filtering for large datasets

### Security Features
- **Role-Based Access**: Different permission levels for different admin types
- **Secure Authentication**: JWT token-based session management
- **Data Protection**: Input validation and XSS protection
- **Audit Trails**: Activity logging and monitoring

### Performance
- **Optimized Rendering**: Efficient React component architecture
- **Lazy Loading**: Code splitting for faster initial load times
- **Caching Strategy**: Intelligent data caching for better performance
- **Error Boundaries**: Graceful error handling and recovery

## API Integration

The dashboard integrates with multiple backend services:
- **Authentication Service**: Admin login and session management
- **Student Service**: Student data and academic records
- **Course Service**: Course information and enrollment data
- **Grade Service**: Academic performance and grading
- **Event Service**: Campus event management
- **Analytics Service**: System metrics and reporting data

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Guidelines

### Code Standards
- ES6+ JavaScript features
- Functional components with hooks
- Consistent naming conventions
- Comprehensive error handling

### Styling Guidelines
- Mobile-first responsive design
- Consistent color scheme and typography
- Accessible UI components
- Professional administrative theme

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow coding standards
4. Add comprehensive tests
5. Submit a pull request

## License

This project is licensed under the MIT License.