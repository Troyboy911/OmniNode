#!/bin/bash

echo "🚀 Setting up Omni Node Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. You'll need to set up PostgreSQL manually."
    echo "   Or install Docker from: https://docs.docker.com/get-docker/"
else
    echo "✅ Docker is installed"
    
    # Start PostgreSQL and Redis with Docker Compose
    echo "🐳 Starting PostgreSQL and Redis containers..."
    docker-compose up -d
    
    # Wait for PostgreSQL to be ready
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    # Check if PostgreSQL is running
    if docker ps | grep -q omninode-postgres; then
        echo "✅ PostgreSQL is running"
    else
        echo "❌ Failed to start PostgreSQL"
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy .env.example to .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration"
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Update .env with your API keys (optional)"
echo "   2. Run 'npm run dev' to start the development server"
echo "   3. Visit http://localhost:4000/api/v1/health to check if the server is running"
echo ""
echo "📚 Useful commands:"
echo "   - npm run dev          : Start development server"
echo "   - npx prisma studio    : Open database GUI"
echo "   - docker-compose down  : Stop database containers"
echo ""