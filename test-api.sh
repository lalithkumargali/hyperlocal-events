#!/bin/bash

echo "Testing API endpoints..."
echo ""

# Test health endpoint
echo "1. Testing GET /health"
curl -s http://localhost:4000/health | jq '.'
echo ""
echo ""

# Test OpenAPI endpoint
echo "2. Testing GET /openapi.json"
curl -s http://localhost:4000/openapi.json | jq '.info'
echo ""
echo ""

# Test suggest endpoint with valid request
echo "3. Testing POST /v1/suggest (valid request)"
curl -s -X POST http://localhost:4000/v1/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 37.7749,
    "lon": -122.4194,
    "minutesAvailable": 120,
    "interests": ["music", "food"],
    "radiusMeters": 5000
  }' | jq '.'
echo ""
echo ""

# Test suggest endpoint with validation error
echo "4. Testing POST /v1/suggest (validation error - invalid lat)"
curl -s -X POST http://localhost:4000/v1/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 999,
    "lon": -122.4194,
    "minutesAvailable": 120
  }' | jq '.'
echo ""

echo "✅ API tests complete!"
