#!/bin/bash

# CogniEdufy Playground Deployment Script
# This script automates the deployment process to the Internet Computer playground network

set -e  # Exit on any error

echo "🚀 Starting CogniEdufy deployment to Playground Network..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    print_error "DFX is not installed. Please install it first:"
    echo "sh -ci \"\$(curl -fsSL https://internetcomputer.org/install.sh)\""
    exit 1
fi

print_success "DFX is installed: $(dfx --version)"

# Check if we're in the right directory
if [ ! -f "dfx.json" ]; then
    print_error "dfx.json not found. Please run this script from the project root directory."
    exit 1
fi

print_status "Building frontend..."
cd src/cogni-icp-frontend

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
else
    print_status "Frontend dependencies already installed"
fi

# Build the frontend
print_status "Building frontend with Vite..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Frontend build completed successfully"
else
    print_error "Frontend build failed"
    exit 1
fi

cd ../..

# Deploy to playground
print_status "Deploying to playground network..."
dfx deploy --playground

if [ $? -eq 0 ]; then
    print_success "Deployment completed successfully"
else
    print_error "Deployment failed"
    exit 1
fi

# Generate Candid interfaces
print_status "Generating Candid interfaces..."
dfx generate --playground

if [ $? -eq 0 ]; then
    print_success "Candid interfaces generated"
else
    print_warning "Candid generation failed (this might be normal if no changes)"
fi

# Get canister IDs
print_status "Retrieving canister information..."

BACKEND_ID=$(dfx canister --playground id cogni-icp-backend 2>/dev/null || echo "Not found")
FRONTEND_ID=$(dfx canister --playground id cogni-icp-frontend 2>/dev/null || echo "Not found")

echo ""
echo "=================================================="
print_success "Deployment Summary"
echo "=================================================="
echo "Backend Canister ID:  $BACKEND_ID"
echo "Frontend Canister ID: $FRONTEND_ID"
echo ""

if [ "$FRONTEND_ID" != "Not found" ]; then
    FRONTEND_URL="https://${FRONTEND_ID}.ic0.app"
    print_success "Frontend URL: $FRONTEND_URL"
    echo ""
    print_status "You can now access your application at:"
    echo "$FRONTEND_URL"
else
    print_warning "Frontend canister ID not found"
fi

echo ""
print_status "Testing backend functions..."

# Test backend functions
print_status "Testing user creation..."
dfx canister call cogni-icp-backend --playground create_user '("demo_user", "demo@cogniedufy.com")' || print_warning "User creation test failed"

print_status "Testing user retrieval..."
dfx canister call cogni-icp-backend --playground get_self --query || print_warning "User retrieval test failed"

echo ""
echo "=================================================="
print_success "Deployment completed successfully! 🎉"
echo "=================================================="

print_status "Next steps:"
echo "1. Visit your frontend URL to test the application"
echo "2. Test all features thoroughly"
echo "3. Check the deployment guide for more information"
echo "4. Monitor canister performance and logs"

echo ""
print_status "Useful commands:"
echo "- Check canister status: dfx canister --playground status"
echo "- View canister logs: dfx canister --playground call cogni-icp-backend get_logs"
echo "- Test specific functions: dfx canister call cogni-icp-backend --playground <function_name>"

echo ""
print_success "Happy testing! 🚀"
