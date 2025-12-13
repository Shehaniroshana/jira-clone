#!/bin/bash

echo "========================================"
echo "  Jira Clone - Quick Setup Script"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is installed
echo "[1/6] Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    echo -e "${GREEN}[OK]${NC} PostgreSQL found"
else
    echo -e "${YELLOW}[WARNING]${NC} PostgreSQL not found in PATH"
    echo "Please ensure PostgreSQL is installed and running"
fi
echo ""

# Check if Go is installed
echo "[2/6] Checking Go installation..."
if ! command -v go &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Go not found! Please install Go 1.21 or higher"
    echo "Download from: https://golang.org/dl/"
    exit 1
else
    echo -e "${GREEN}[OK]${NC} Go found"
    go version
fi
echo ""

# Check if Node.js is installed
echo "[3/6] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Node.js not found! Please install Node.js 18 or higher"
    echo "Download from: https://nodejs.org/"
    exit 1
else
    echo -e "${GREEN}[OK]${NC} Node.js found"
    node --version
fi
echo ""

# Setup Backend
echo "[4/6] Setting up Backend..."
cd backend

if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp ../.env.example .env
    echo -e "${YELLOW}[INFO]${NC} Please edit backend/.env with your database credentials"
fi

echo "Installing Go dependencies..."
go mod download
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR]${NC} Failed to download Go dependencies"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Go dependencies installed"
cd ..
echo ""

# Setup Frontend
echo "[5/6] Setting up Frontend..."
cd frontend

echo "Installing npm dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR]${NC} Failed to install npm dependencies"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} npm dependencies installed"
cd ..
echo ""

# Final instructions
echo "[6/6] Setup Complete!"
echo ""
echo "========================================"
echo "  Next Steps:"
echo "========================================"
echo ""
echo "1. Configure your database in backend/.env"
echo "2. Ensure PostgreSQL is running"
echo "3. Start the backend:"
echo "   cd backend"
echo "   go run cmd/api/main.go"
echo ""
echo "4. In a new terminal, start the frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "5. Open http://localhost:5173 in your browser"
echo ""
echo "========================================"
echo ""
