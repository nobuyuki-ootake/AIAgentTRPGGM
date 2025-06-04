#!/bin/bash

echo "Starting TRPG AI Agent GM Development Environment..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install dependencies if needed
install_deps() {
    echo "Installing dependencies for $1..."
    cd "$1"
    if [ -f "package.json" ]; then
        pnpm install --no-optional || npm install
    fi
    cd ..
}

# Check if pnpm is available
if ! command_exists pnpm; then
    echo "pnpm not found. Please install pnpm first:"
    echo "npm install -g pnpm"
    exit 1
fi

# Install root dependencies
echo "Installing root dependencies..."
pnpm install --no-optional

# Install app dependencies
echo "Installing app dependencies..."
install_deps "apps/frontend"
install_deps "apps/proxy-server"
install_deps "packages/types"

# Build types package
echo "Building types package..."
cd packages/types
pnpm run build || npm run build
cd ../..

# Start development servers
echo "Starting development servers..."
echo "Frontend will be available at http://localhost:5173"
echo "Proxy server will be available at http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"

# Use concurrently to run both servers
if command_exists npx; then
    npx concurrently \
        --names "TYPES,FRONTEND,PROXY" \
        --prefix-colors "blue,green,yellow" \
        "cd packages/types && pnpm run dev" \
        "cd apps/frontend && pnpm run dev" \
        "cd apps/proxy-server && pnpm run dev"
else
    echo "npx not available. Starting servers individually..."
    echo "Please run the following commands in separate terminals:"
    echo "1. cd packages/types && pnpm run dev"
    echo "2. cd apps/frontend && pnpm run dev"
    echo "3. cd apps/proxy-server && pnpm run dev"
fi