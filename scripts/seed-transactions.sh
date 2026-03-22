#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:8080}"
TOKEN="${TOKEN:-}"

for i in $(seq 1 20); do
  amount=$(( (RANDOM % 9000) + 100 ))
  user=$(( (i % 6) + 1 ))
  location=$(printf "%s" "NY CA TX FL WA" | awk -v idx=$(( (i % 5) + 1 )) '{print $idx}')

  curl -sS -X POST "$API_URL/api/v1/transactions" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{\"transactionId\":\"tx-seed-$i\",\"userId\":\"user-$user\",\"amount\":$amount,\"currency\":\"USD\",\"location\":\"$location\",\"deviceId\":\"device-$((i%4+1))\",\"ipAddress\":\"10.0.0.$i\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" >/dev/null
  echo "seeded tx-seed-$i"
done
