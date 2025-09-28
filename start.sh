#!/bin/bash

# Campus Life Management System - Startup Script

echo "======================================"
echo "Campus Life Management System"
echo "FAST University Peshawar"
echo "======================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Function to wait for service
wait_for_service() {
    local service=$1
    local port=$2
    echo -n "Waiting for $service (port $port)..."
    for i in {1..30}; do
        if nc -z localhost $port 2>/dev/null; then
            echo " ✅ Ready!"
            return 0
        fi
        echo -n "."
        sleep 2
    done
    echo " ⚠️  Timeout"
    return 1
}

# Build and start services
echo "📦 Building Docker images..."
$COMPOSE_CMD build

echo ""
echo "🚀 Starting services..."
$COMPOSE_CMD up -d

echo ""
echo "⏳ Waiting for services to be ready..."
echo ""

# Wait for databases first
wait_for_service "PostgreSQL" 5432
wait_for_service "MongoDB" 27017
wait_for_service "Redis" 6379

echo ""
# Wait for backend services
wait_for_service "Auth Service" 3001
wait_for_service "Student Service" 3002
wait_for_service "Course Service" 3003
wait_for_service "Analytics Service" 3013

echo ""
# Wait for frontend services
wait_for_service "Student Portal" 3012
wait_for_service "Admin Dashboard" 3011
wait_for_service "API Gateway" 80

echo ""
echo "======================================"
echo "✅ All services are running!"
echo "======================================"
echo ""
echo "📱 Access the applications:"
echo "   Student Portal:   http://localhost:3012"
echo "   Admin Dashboard:  http://localhost:3011"
echo "   API Gateway:      http://localhost/health"
echo ""
echo "🔑 Default Credentials:"
echo "   Student: student@campus.edu / password"
echo "   Admin:   admin@campus.edu / admin123"
echo ""
echo "📊 Service Status:"
$COMPOSE_CMD ps
echo ""
echo "💡 Useful commands:"
echo "   View logs:        $COMPOSE_CMD logs -f [service-name]"
echo "   Stop all:         $COMPOSE_CMD down"
echo "   Restart service:  $COMPOSE_CMD restart [service-name]"
echo ""