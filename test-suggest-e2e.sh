#!/bin/bash

echo "🧪 Testing /v1/suggest endpoint (end-to-end)"
echo ""

# Test with valid request
echo "Testing POST /v1/suggest with valid request..."
curl -s -X POST http://localhost:4000/v1/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 37.7749,
    "lon": -122.4194,
    "minutesAvailable": 120,
    "interests": ["music", "technology"],
    "radiusMeters": 5000
  }' | jq '.'

echo ""
echo "✅ End-to-end test complete!"
