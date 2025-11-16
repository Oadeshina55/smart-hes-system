#!/bin/bash

# Start script for Python DLMS Service

echo "================================================"
echo "  Python DLMS Communication Service"
echo "  Starting..."
echo "================================================"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating..."
    python3 -m venv venv
    echo "Virtual environment created."
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install/upgrade dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Copy .env if not exists
if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "Please configure .env file before running in production."
fi

# Start the service
echo "================================================"
echo "  Starting DLMS Service on port 8001"
echo "================================================"

python src/api.py
