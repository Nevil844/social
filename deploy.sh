#!/bin/bash

# Production Deployment Script for Social Virtual Workspace
# Run this on your EC2 instance

set -e  # Exit on any error

echo "🚀 Starting Social Virtual Workspace deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "Run: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    echo "Run: sudo curl -L \"https://github.com/docker/compose/releases/download/1.29.2/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
    echo "Then: sudo chmod +x /usr/local/bin/docker-compose"
    exit 1
fi

# Check if environment file exists
if [ ! -f "server/.env" ]; then
    print_warning "Environment file not found. Creating from template..."
    cp server/env.production.template server/.env
    print_warning "⚠️  IMPORTANT: Edit server/.env with your production values before continuing!"
    print_warning "You need to set:"
    print_warning "  - DOMAIN (your EC2 domain or IP)"
    print_warning "  - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
    print_warning "  - SESSION_SECRET and JWT_SECRET"
    echo ""
    read -p "Have you configured server/.env? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Please configure server/.env first, then run this script again."
        exit 1
    fi
fi

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down || true

# Build and start the application
print_status "Building and starting the application..."
docker-compose up --build -d

# Wait for the application to start
print_status "Waiting for application to start..."
sleep 10

# Check if the application is running
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_status "✅ Application is running successfully!"
    echo ""
    print_status "🌐 Your application is now available at:"
    
    # Try to get the public IP
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "your-ec2-ip")
    
    echo "   🔗 http://$PUBLIC_IP:3001"
    echo "   🔗 https://$PUBLIC_IP:3001 (if you have SSL)"
    echo ""
    print_status "📊 Monitor your application:"
    echo "   📋 Logs: docker-compose logs -f"
    echo "   👥 Active users: curl http://localhost:3001/api/who-is-online"
    echo "   🏥 Health check: curl http://localhost:3001/health"
    echo ""
    print_status "🔧 Useful commands:"
    echo "   🔄 Restart: docker-compose restart"
    echo "   🛑 Stop: docker-compose down"
    echo "   📱 Update: git pull && docker-compose up --build -d"
    
else
    print_error "❌ Application failed to start. Check logs with:"
    echo "   docker-compose logs"
    exit 1
fi

print_status "🎉 Deployment completed successfully!" 