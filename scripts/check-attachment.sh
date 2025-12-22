#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Uso: $0 <path> <bucket> [signed-server-url]"
  echo "Ex: $0 c7f13743-.../file.jpg notas_fiscais http://localhost:3001"
  exit 1
fi

PATH_OBJ="$1"
BUCKET="$2"
SIGNED_SERVER_URL="${3:-${VITE_SIGNED_URL_SERVER_URL:-${SIGNED_URL_SERVER_URL:-http://localhost:3001}}}"

echo "Payload: path=$PATH_OBJ bucket=$BUCKET"
echo "Signed-url server: $SIGNED_SERVER_URL"

PAYLOAD=$(printf '{"path":"%s","bucket":"%s","expires":120}' "$PATH_OBJ" "$BUCKET")

echo "Requesting signed URL..."
RESPONSE=$(curl -s -X POST "$SIGNED_SERVER_URL/signed-url" -H "Content-Type: application/json" -d "$PAYLOAD" || true)

SIGNED_URL=$(printf '%s' "$RESPONSE" | python3 -c "import sys,json
try:
    obj=json.load(sys.stdin)
    print(obj.get('signedUrl',''))
except Exception:
    sys.exit(0)
" 2>/dev/null || true)

if [ -z "$SIGNED_URL" ]; then
  echo "ERRO: servidor não retornou 'signedUrl' ou resposta inválida"
  echo "Resposta do servidor:\n$RESPONSE"
  exit 2
fi

echo "Signed URL recebido:" 
echo "$SIGNED_URL"

echo "Executando HEAD na signed URL..."
curl -I -s -S "$SIGNED_URL" || { echo "HEAD falhou"; exit 3; }

echo "Feito."
