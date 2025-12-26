#!/bin/bash
# Quick start script for OrderHub

echo "==================================="
echo "  OrderHub - Quick Start"
echo "==================================="
echo ""

# Check if running with Docker
if [ "$1" = "docker" ]; then
    echo "Starting with Docker Compose..."
    docker-compose up -d
    echo ""
    echo "OrderHub is starting!"
    echo "Backend API: http://localhost:8000"
    echo "Frontend: http://localhost:3000"
    echo "API Docs: http://localhost:8000/docs"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
else
    echo "Starting in development mode..."
    echo ""

    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
    fi

    # Activate virtual environment
    source venv/bin/activate

    # Install dependencies
    echo "Installing Python dependencies..."
    pip install -q -r requirements.txt

    # Set up .env if it doesn't exist
    if [ ! -f ".env" ]; then
        echo "Creating .env file..."
        cp .env.example .env
    fi

    # Initialize database
    echo "Initializing database..."
    python -m src.db.database

    # Start backend
    echo ""
    echo "Starting backend server..."
    echo "Backend API: http://localhost:8000"
    echo "API Docs: http://localhost:8000/docs"
    echo ""
    uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
fi
