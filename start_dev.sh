cd c#!/bin/bash
# Start backend
echo "Starting Backend..."
npm start &
BACKEND_PID=$!

# Start frontend
echo "Starting Frontend..."
cd client || { echo "Client directory not found"; kill $BACKEND_PID; exit 1; }

if [ ! -f package.json ]; then
    echo "Client package.json not found"
    kill $BACKEND_PID
    exit 1
fi

npm run dev &
FRONTEND_PID=$!

# Handle shutdown
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

wait
