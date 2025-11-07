#!/bin/bash

# Build script for Render deployment
echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build the application (excluding tests)
echo "Building application..."
npm run build

echo "Build completed successfully!"

# List the dist directory to verify build
echo "Build output:"
ls -la dist/