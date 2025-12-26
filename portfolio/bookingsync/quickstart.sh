#!/bin/bash

echo "================================================"
echo "BookingSync - Appointment Automation System"
echo "================================================"
echo ""

# Check if running in demo mode
if [ "$1" == "demo" ] || [ -z "$1" ]; then
    echo "Starting in DEMO MODE (no external dependencies required)"
    echo ""

    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
    fi

    # Activate virtual environment
    echo "Activating virtual environment..."
    source venv/bin/activate

    # Install dependencies
    echo "Installing dependencies..."
    pip install -q -r requirements.txt

    # Set demo mode
    export DEMO_MODE=true

    echo ""
    echo "Starting FastAPI server..."
    echo "API Documentation: http://localhost:8000/docs"
    echo "API Base URL: http://localhost:8000"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""

    # Start the server
    python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

elif [ "$1" == "docker" ]; then
    echo "Starting with Docker Compose..."
    echo ""
    docker-compose up --build

elif [ "$1" == "test" ]; then
    echo "Running tests..."
    echo ""

    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi

    source venv/bin/activate
    pip install -q -r requirements.txt

    export DEMO_MODE=true
    pytest tests/ -v

else
    echo "Usage:"
    echo "  ./quickstart.sh demo    - Start in demo mode (default)"
    echo "  ./quickstart.sh docker  - Start with Docker Compose"
    echo "  ./quickstart.sh test    - Run tests"
    echo ""
fi
