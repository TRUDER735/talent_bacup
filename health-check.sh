#!/bin/bash

# Health check script for Talent API production endpoints
# Usage: ./health-check.sh [BASE_URL]

BASE_URL=${1:-"http://localhost:4001"}
TALENT_API_URL="$BASE_URL/talent"

echo "🔍 Testing Talent API endpoints..."
echo "Base URL: $TALENT_API_URL"
echo "=================================="

# Test 1: Health check endpoint
echo "1. Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$TALENT_API_URL/health")
HEALTH_BODY=$(echo $HEALTH_RESPONSE | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
HEALTH_STATUS=$(echo $HEALTH_RESPONSE | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

if [ "$HEALTH_STATUS" -eq 200 ]; then
    echo "✅ Health endpoint: $HEALTH_STATUS"
    echo "   Response: $HEALTH_BODY"
else
    echo "❌ Health endpoint failed: $HEALTH_STATUS"
fi

# Test 2: Signup endpoint (POST)
echo ""
echo "2. Testing signup endpoint..."
SIGNUP_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123","role":"talent"}' \
  -w "HTTPSTATUS:%{http_code}" \
  "$TALENT_API_URL/auth/signup")

SIGNUP_BODY=$(echo $SIGNUP_RESPONSE | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
SIGNUP_STATUS=$(echo $SIGNUP_RESPONSE | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

if [ "$SIGNUP_STATUS" -eq 201 ] || [ "$SIGNUP_STATUS" -eq 409 ] || [ "$SIGNUP_STATUS" -eq 500 ]; then
    echo "✅ Signup endpoint responding: $SIGNUP_STATUS"
    echo "   Response: $SIGNUP_BODY"
else
    echo "❌ Signup endpoint failed: $SIGNUP_STATUS"
    echo "   Response: $SIGNUP_BODY"
fi

# Test 3: Signin endpoint (POST) 
echo ""
echo "3. Testing signin endpoint..."
SIGNIN_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}' \
  -w "HTTPSTATUS:%{http_code}" \
  "$TALENT_API_URL/auth/signin")

SIGNIN_BODY=$(echo $SIGNIN_RESPONSE | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
SIGNIN_STATUS=$(echo $SIGNIN_RESPONSE | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')

if [ "$SIGNIN_STATUS" -eq 200 ] || [ "$SIGNIN_STATUS" -eq 401 ] || [ "$SIGNIN_STATUS" -eq 500 ]; then
    echo "✅ Signin endpoint responding: $SIGNIN_STATUS"
    echo "   Response: $SIGNIN_BODY"
else
    echo "❌ Signin endpoint failed: $SIGNIN_STATUS"
    echo "   Response: $SIGNIN_BODY"
fi

# Test 4: Swagger docs
echo ""
echo "4. Testing Swagger docs..."
DOCS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/docs")
if [ "$DOCS_STATUS" -eq 200 ]; then
    echo "✅ Swagger docs: $DOCS_STATUS"
else
    echo "❌ Swagger docs failed: $DOCS_STATUS"
fi

echo ""
echo "=================================="
echo "✅ Health check completed"
echo ""
echo "🔧 Container logs (if running locally):"
echo "   docker logs \$(docker ps -q --filter ancestor=registry.digitalocean.com/uncommonorg-registry/talent-api:main)"
