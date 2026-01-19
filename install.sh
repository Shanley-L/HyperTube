#!/bin/bash

echo "=== HyperTube Installation Script ==="
echo ""

echo "Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    echo "✓ Backend dependencies installed"
else
    echo "✓ Backend dependencies already installed"
fi
cd ..

echo ""
echo "Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
    echo "✓ Frontend dependencies installed"
else
    echo "✓ Frontend dependencies already installed"
fi
cd ..

echo ""
echo "=== Installation complete ==="
echo ""
echo "Next steps:"
echo "1. Create a .env file in backend/ directory (see ENV_SETUP.md)"
echo "2. Set up PostgreSQL database:"
echo "   createdb hypertube"
echo "   psql hypertube < backend/database/schema.sql"
echo "3. Start backend: cd backend && npm run dev"
echo "4. Start frontend: cd frontend && npm run dev"
