#!/bin/bash
# QA feedback loop for Bug 1: "scan QR untuk pesan menu tidak berhasil"
# Root cause: tables created via the admin UI get qr_code = NULL, so the QR
# dialog renders an empty code. This script proves the API seam:
#   create table -> read back -> qr_code MUST be non-null and unique.
# Exit 0 = green (fixed), exit 1 = red (bug present).
set -u
BASE="${BASE:-http://localhost:8080/api/v1}"
NUM="QA-QR-$(date +%s)"

TOKEN=$(curl -s --max-time 8 -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).data.token)}catch(e){console.log('')}})")
[ -z "$TOKEN" ] && { echo "RED: login failed"; exit 1; }

CREATE=$(curl -s --max-time 8 -X POST "$BASE/admin/tables" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d "{\"table_number\":\"$NUM\",\"seating_capacity\":2,\"location\":\"QA\"}")
ID=$(echo "$CREATE" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).data.id||'')}catch(e){console.log('')}})")
[ -z "$ID" ] && { echo "RED: create failed: $CREATE"; exit 1; }

QR=$(echo "$CREATE" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).data.qr_code??'')}catch(e){console.log('')}})")

cleanup() {
  [ -n "${ID:-}" ] && curl -s --max-time 8 -X DELETE "$BASE/admin/tables/$ID" -H "Authorization: Bearer $TOKEN" >/dev/null
}
trap cleanup EXIT

if [ -z "$QR" ]; then
  echo "RED: new table '$NUM' has NULL/empty qr_code -> QR dialog renders empty code (user bug)"
  exit 1
fi

# Uniqueness check
DUP=$(docker exec pos-postgres-dev psql -U postgres -d pos_system -tAc \
  "SELECT COUNT(*) FROM dining_tables WHERE qr_code='$QR'" 2>/dev/null)
if [ "${DUP:-2}" != "1" ]; then
  echo "RED: qr_code '$QR' not unique (count=${DUP:-db-unreachable})"
  exit 1
fi

echo "GREEN: table '$NUM' created with qr_code='$QR' (unique)"
exit 0
