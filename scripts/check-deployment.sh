#!/bin/bash

# Deployment Health Check Script
# Usage: ./scripts/check-deployment.sh <backend-url> <frontend-url>

BACKEND_URL=$1
FRONTEND_URL=$2

echo "🔍 Checking Food Ordering Platform Deployment..."
echo "================================================"
echo ""

# Check if URLs are provided
if [ -z "$BACKEND_URL" ] || [ -z "$FRONTEND_URL" ]; then
    echo "❌ Error: Please provide both backend and frontend URLs"
    echo "Usage: ./scripts/check-deployment.sh <backend-url> <frontend-url>"
    echo "Example: ./scripts/check-deployment.sh https://api.example.com https://app.example.com"
    exit 1
fi

# Check Backend Health
echo "1️⃣  Checking Backend Health..."
echo "   URL: $BACKEND_URL/api/health"
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/health")

if [ "$BACKEND_RESPONSE" = "200" ]; then
    echo "   ✅ Backend is healthy (HTTP $BACKEND_RESPONSE)"
    curl -s "$BACKEND_URL/api/health" | jq '.' 2>/dev/null || curl -s "$BACKEND_URL/api/health"
else
    echo "   ❌ Backend is not responding correctly (HTTP $BACKEND_RESPONSE)"
    echo "   Check Render logs for errors"
fi
echo ""

# Check Frontend
echo "2️⃣  Checking Frontend..."
echo "   URL: $FRONTEND_URL"
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")

if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "   ✅ Frontend is accessible (HTTP $FRONTEND_RESPONSE)"
else
    echo "   ❌ Frontend is not responding correctly (HTTP $FRONTEND_RESPONSE)"
    echo "   Check Vercel logs for errors"
fi
echo ""

# Check CORS
echo "3️⃣  Checking CORS Configuration..."
CORS_RESPONSE=$(curl -s -H "Origin: $FRONTEND_URL" -H "Access-Control-Request-Method: GET" -X OPTIONS "$BACKEND_URL/api/health" -o /dev/null -w "%{http_code}")

if [ "$CORS_RESPONSE" = "200" ] || [ "$CORS_RESPONSE" = "204" ]; then
    echo "   ✅ CORS is configured correctly"
else
    echo "   ⚠️  CORS might have issues (HTTP $CORS_RESPONSE)"
    echo "   Make sure CORS_ORIGIN in backend matches: $FRONTEND_URL"
fi
echo ""

# Check API Endpoints
echo "4️⃣  Checking API Endpoints..."

# Check inventory endpoint
INVENTORY_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/inventory")
if [ "$INVENTORY_RESPONSE" = "200" ]; then
    echo "   ✅ Inventory API is working (HTTP $INVENTORY_RESPONSE)"
else
    echo "   ❌ Inventory API failed (HTTP $INVENTORY_RESPONSE)"
fi

# Check auth endpoint
AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/auth/login" -X POST -H "Content-Type: application/json" -d '{}')
if [ "$AUTH_RESPONSE" = "400" ] || [ "$AUTH_RESPONSE" = "422" ]; then
    echo "   ✅ Auth API is working (HTTP $AUTH_RESPONSE - expected validation error)"
else
    echo "   ⚠️  Auth API response: HTTP $AUTH_RESPONSE"
fi
echo ""

# Summary
echo "================================================"
echo "📊 Deployment Summary"
echo "================================================"
echo "Backend URL:  $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""
echo "Next Steps:"
echo "1. If backend is down, check Render logs"
echo "2. If frontend is down, check Vercel logs"
echo "3. If CORS fails, update CORS_ORIGIN in Render"
echo "4. Test the app in browser: $FRONTEND_URL"
echo ""
