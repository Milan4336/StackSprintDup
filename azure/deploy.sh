#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Copy azure/env.template to azure/.env and fill values."
  exit 1
fi

set -a
source "${ENV_FILE}"
set +a

log() {
  printf '\n[%s] %s\n' "$(date +%H:%M:%S)" "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1"
    exit 1
  fi
}

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required variable in azure/.env: ${name}"
    exit 1
  fi
}

require_cmd az
require_cmd docker
require_cmd curl
require_cmd python3

for var in \
  AZ_RESOURCE_GROUP \
  AZ_LOCATION \
  AZ_CONTAINERAPPS_ENV \
  AZ_ACR_NAME \
  AZ_COSMOS_ACCOUNT \
  AZ_COSMOS_DB_NAME \
  AZ_REDIS_NAME \
  AZ_FRONTEND_APP \
  AZ_API_APP \
  AZ_ML_APP \
  IMAGE_TAG \
  JWT_SECRET
do
  require_var "${var}"
done

NODE_ENV="${NODE_ENV:-production}"
PORT="${PORT:-8080}"
JWT_EXPIRES_IN="${JWT_EXPIRES_IN:-1h}"
HIGH_AMOUNT_THRESHOLD="${HIGH_AMOUNT_THRESHOLD:-5000}"
VELOCITY_WINDOW_MINUTES="${VELOCITY_WINDOW_MINUTES:-5}"
VELOCITY_TX_THRESHOLD="${VELOCITY_TX_THRESHOLD:-5}"
SCORE_RULE_WEIGHT="${SCORE_RULE_WEIGHT:-0.6}"
SCORE_ML_WEIGHT="${SCORE_ML_WEIGHT:-0.4}"
AUTONOMOUS_ALERT_THRESHOLD="${AUTONOMOUS_ALERT_THRESHOLD:-80}"
ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-http://localhost:5173,http://localhost:8080}"

log "Ensuring Azure login"
if ! az account show >/dev/null 2>&1; then
  az login
fi

if [[ -n "${AZ_SUBSCRIPTION_ID:-}" ]]; then
  az account set --subscription "${AZ_SUBSCRIPTION_ID}"
fi

az extension add --name containerapp --upgrade --yes >/dev/null

log "Creating resource group and shared services"
az group create \
  --name "${AZ_RESOURCE_GROUP}" \
  --location "${AZ_LOCATION}" \
  --only-show-errors >/dev/null

if ! az acr show --name "${AZ_ACR_NAME}" --resource-group "${AZ_RESOURCE_GROUP}" >/dev/null 2>&1; then
  az acr create \
    --name "${AZ_ACR_NAME}" \
    --resource-group "${AZ_RESOURCE_GROUP}" \
    --location "${AZ_LOCATION}" \
    --sku Basic \
    --admin-enabled true \
    --only-show-errors >/dev/null
fi

ACR_LOGIN_SERVER="$(az acr show --name "${AZ_ACR_NAME}" --resource-group "${AZ_RESOURCE_GROUP}" --query loginServer -o tsv)"
ACR_USERNAME="$(az acr credential show --name "${AZ_ACR_NAME}" --query username -o tsv)"
ACR_PASSWORD="$(az acr credential show --name "${AZ_ACR_NAME}" --query 'passwords[0].value' -o tsv)"

az acr login --name "${AZ_ACR_NAME}" >/dev/null

if ! az cosmosdb show --name "${AZ_COSMOS_ACCOUNT}" --resource-group "${AZ_RESOURCE_GROUP}" >/dev/null 2>&1; then
  az cosmosdb create \
    --name "${AZ_COSMOS_ACCOUNT}" \
    --resource-group "${AZ_RESOURCE_GROUP}" \
    --kind MongoDB \
    --locations regionName="${AZ_LOCATION}" failoverPriority=0 isZoneRedundant=false \
    --default-consistency-level Session \
    --only-show-errors >/dev/null
fi

if ! az cosmosdb mongodb database show \
  --account-name "${AZ_COSMOS_ACCOUNT}" \
  --resource-group "${AZ_RESOURCE_GROUP}" \
  --name "${AZ_COSMOS_DB_NAME}" >/dev/null 2>&1; then
  az cosmosdb mongodb database create \
    --account-name "${AZ_COSMOS_ACCOUNT}" \
    --resource-group "${AZ_RESOURCE_GROUP}" \
    --name "${AZ_COSMOS_DB_NAME}" \
    --throughput 400 \
    --only-show-errors >/dev/null
fi

COSMOS_CONN_RAW="$(az cosmosdb keys list \
  --name "${AZ_COSMOS_ACCOUNT}" \
  --resource-group "${AZ_RESOURCE_GROUP}" \
  --type connection-strings \
  --query 'connectionStrings[0].connectionString' -o tsv)"

if [[ -z "${COSMOS_CONN_RAW}" ]]; then
  echo "Failed to resolve Cosmos DB Mongo connection string."
  exit 1
fi

MONGO_URI="$(echo "${COSMOS_CONN_RAW}" | sed "s|/\\?|/${AZ_COSMOS_DB_NAME}?|")"

if ! az redis show --name "${AZ_REDIS_NAME}" --resource-group "${AZ_RESOURCE_GROUP}" >/dev/null 2>&1; then
  az redis create \
    --name "${AZ_REDIS_NAME}" \
    --resource-group "${AZ_RESOURCE_GROUP}" \
    --location "${AZ_LOCATION}" \
    --sku Basic \
    --vm-size C0 \
    --enable-non-ssl-port false \
    --only-show-errors >/dev/null
fi

REDIS_HOST="$(az redis show --name "${AZ_REDIS_NAME}" --resource-group "${AZ_RESOURCE_GROUP}" --query hostName -o tsv)"
REDIS_KEY="$(az redis list-keys --name "${AZ_REDIS_NAME}" --resource-group "${AZ_RESOURCE_GROUP}" --query primaryKey -o tsv)"
REDIS_URI="rediss://:${REDIS_KEY}@${REDIS_HOST}:6380"

if ! az containerapp env show --name "${AZ_CONTAINERAPPS_ENV}" --resource-group "${AZ_RESOURCE_GROUP}" >/dev/null 2>&1; then
  az containerapp env create \
    --name "${AZ_CONTAINERAPPS_ENV}" \
    --resource-group "${AZ_RESOURCE_GROUP}" \
    --location "${AZ_LOCATION}" \
    --only-show-errors >/dev/null
fi

API_IMAGE="${ACR_LOGIN_SERVER}/api-gateway:${IMAGE_TAG}"
ML_IMAGE="${ACR_LOGIN_SERVER}/ml-service:${IMAGE_TAG}"
FRONTEND_IMAGE="${ACR_LOGIN_SERVER}/frontend:${IMAGE_TAG}"

log "Building and pushing API image"
docker build -t "${API_IMAGE}" "${ROOT_DIR}/api-gateway"
docker push "${API_IMAGE}"

log "Building and pushing ML image"
docker build -t "${ML_IMAGE}" "${ROOT_DIR}/ml-service"
docker push "${ML_IMAGE}"

log "Deploying ml-service container app"
if az containerapp show --name "${AZ_ML_APP}" --resource-group "${AZ_RESOURCE_GROUP}" >/dev/null 2>&1; then
  az containerapp update \
    --name "${AZ_ML_APP}" \
    --resource-group "${AZ_RESOURCE_GROUP}" \
    --image "${ML_IMAGE}" \
    --set-env-vars NODE_ENV=production PORT=8000 \
    --only-show-errors >/dev/null
else
  az containerapp create \
    --name "${AZ_ML_APP}" \
    --resource-group "${AZ_RESOURCE_GROUP}" \
    --environment "${AZ_CONTAINERAPPS_ENV}" \
    --image "${ML_IMAGE}" \
    --registry-server "${ACR_LOGIN_SERVER}" \
    --registry-username "${ACR_USERNAME}" \
    --registry-password "${ACR_PASSWORD}" \
    --ingress internal \
    --target-port 8000 \
    --min-replicas 1 \
    --max-replicas 3 \
    --cpu 0.5 \
    --memory 1.0Gi \
    --env-vars NODE_ENV=production PORT=8000 \
    --only-show-errors >/dev/null
fi

ML_FQDN="$(az containerapp show --name "${AZ_ML_APP}" --resource-group "${AZ_RESOURCE_GROUP}" --query properties.configuration.ingress.fqdn -o tsv)"
if [[ -z "${ML_FQDN}" ]]; then
  echo "Failed to resolve ml-service FQDN."
  exit 1
fi
ML_SERVICE_URL="https://${ML_FQDN}"

log "Deploying api-gateway container app"
if az containerapp show --name "${AZ_API_APP}" --resource-group "${AZ_RESOURCE_GROUP}" >/dev/null 2>&1; then
  az containerapp update \
    --name "${AZ_API_APP}" \
    --resource-group "${AZ_RESOURCE_GROUP}" \
    --image "${API_IMAGE}" \
    --set-env-vars \
      NODE_ENV="${NODE_ENV}" \
      PORT="${PORT}" \
      MONGO_URI="${MONGO_URI}" \
      REDIS_URI="${REDIS_URI}" \
      JWT_SECRET="${JWT_SECRET}" \
      JWT_EXPIRES_IN="${JWT_EXPIRES_IN}" \
      ML_SERVICE_URL="${ML_SERVICE_URL}" \
      ALLOWED_ORIGINS="${ALLOWED_ORIGINS}" \
      HIGH_AMOUNT_THRESHOLD="${HIGH_AMOUNT_THRESHOLD}" \
      VELOCITY_WINDOW_MINUTES="${VELOCITY_WINDOW_MINUTES}" \
      VELOCITY_TX_THRESHOLD="${VELOCITY_TX_THRESHOLD}" \
      SCORE_RULE_WEIGHT="${SCORE_RULE_WEIGHT}" \
      SCORE_ML_WEIGHT="${SCORE_ML_WEIGHT}" \
      AUTONOMOUS_ALERT_THRESHOLD="${AUTONOMOUS_ALERT_THRESHOLD}" \
    --only-show-errors >/dev/null
else
  az containerapp create \
    --name "${AZ_API_APP}" \
    --resource-group "${AZ_RESOURCE_GROUP}" \
    --environment "${AZ_CONTAINERAPPS_ENV}" \
    --image "${API_IMAGE}" \
    --registry-server "${ACR_LOGIN_SERVER}" \
    --registry-username "${ACR_USERNAME}" \
    --registry-password "${ACR_PASSWORD}" \
    --ingress external \
    --target-port 8080 \
    --min-replicas 1 \
    --max-replicas 5 \
    --cpu 1.0 \
    --memory 2.0Gi \
    --env-vars \
      NODE_ENV="${NODE_ENV}" \
      PORT="${PORT}" \
      MONGO_URI="${MONGO_URI}" \
      REDIS_URI="${REDIS_URI}" \
      JWT_SECRET="${JWT_SECRET}" \
      JWT_EXPIRES_IN="${JWT_EXPIRES_IN}" \
      ML_SERVICE_URL="${ML_SERVICE_URL}" \
      ALLOWED_ORIGINS="${ALLOWED_ORIGINS}" \
      HIGH_AMOUNT_THRESHOLD="${HIGH_AMOUNT_THRESHOLD}" \
      VELOCITY_WINDOW_MINUTES="${VELOCITY_WINDOW_MINUTES}" \
      VELOCITY_TX_THRESHOLD="${VELOCITY_TX_THRESHOLD}" \
      SCORE_RULE_WEIGHT="${SCORE_RULE_WEIGHT}" \
      SCORE_ML_WEIGHT="${SCORE_ML_WEIGHT}" \
      AUTONOMOUS_ALERT_THRESHOLD="${AUTONOMOUS_ALERT_THRESHOLD}" \
    --only-show-errors >/dev/null
fi

API_FQDN="$(az containerapp show --name "${AZ_API_APP}" --resource-group "${AZ_RESOURCE_GROUP}" --query properties.configuration.ingress.fqdn -o tsv)"
if [[ -z "${API_FQDN}" ]]; then
  echo "Failed to resolve api-gateway FQDN."
  exit 1
fi
API_URL="https://${API_FQDN}"
VITE_API_URL="${API_URL}/api/v1"
VITE_WS_URL="${API_URL}"

log "Building and pushing frontend image"
docker build \
  --build-arg VITE_API_URL="${VITE_API_URL}" \
  --build-arg VITE_WS_URL="${VITE_WS_URL}" \
  -t "${FRONTEND_IMAGE}" \
  "${ROOT_DIR}/frontend"
docker push "${FRONTEND_IMAGE}"

log "Deploying frontend container app"
if az containerapp show --name "${AZ_FRONTEND_APP}" --resource-group "${AZ_RESOURCE_GROUP}" >/dev/null 2>&1; then
  az containerapp update \
    --name "${AZ_FRONTEND_APP}" \
    --resource-group "${AZ_RESOURCE_GROUP}" \
    --image "${FRONTEND_IMAGE}" \
    --only-show-errors >/dev/null
else
  az containerapp create \
    --name "${AZ_FRONTEND_APP}" \
    --resource-group "${AZ_RESOURCE_GROUP}" \
    --environment "${AZ_CONTAINERAPPS_ENV}" \
    --image "${FRONTEND_IMAGE}" \
    --registry-server "${ACR_LOGIN_SERVER}" \
    --registry-username "${ACR_USERNAME}" \
    --registry-password "${ACR_PASSWORD}" \
    --ingress external \
    --target-port 80 \
    --min-replicas 1 \
    --max-replicas 3 \
    --cpu 0.5 \
    --memory 1.0Gi \
    --only-show-errors >/dev/null
fi

FRONTEND_FQDN="$(az containerapp show --name "${AZ_FRONTEND_APP}" --resource-group "${AZ_RESOURCE_GROUP}" --query properties.configuration.ingress.fqdn -o tsv)"
if [[ -z "${FRONTEND_FQDN}" ]]; then
  echo "Failed to resolve frontend FQDN."
  exit 1
fi
FRONTEND_URL="https://${FRONTEND_FQDN}"

FINAL_ALLOWED_ORIGINS="${FRONTEND_URL},${API_URL},http://localhost:5173,http://localhost:8080"
az containerapp update \
  --name "${AZ_API_APP}" \
  --resource-group "${AZ_RESOURCE_GROUP}" \
  --set-env-vars ALLOWED_ORIGINS="${FINAL_ALLOWED_ORIGINS}" \
  --only-show-errors >/dev/null

log "Running deployment verification"
API_HEALTH_CODE="$(curl -s -o /dev/null -w '%{http_code}' "${API_URL}/health")"
FRONTEND_CODE="$(curl -s -o /dev/null -w '%{http_code}' "${FRONTEND_URL}")"

if [[ "${API_HEALTH_CODE}" != "200" ]]; then
  echo "API health check failed (${API_HEALTH_CODE}) at ${API_URL}/health"
  exit 1
fi

if [[ "${FRONTEND_CODE}" != "200" ]]; then
  echo "Frontend check failed (${FRONTEND_CODE}) at ${FRONTEND_URL}"
  exit 1
fi

REGISTER_CODE="$(curl -s -o /tmp/azure-register.json -w '%{http_code}' \
  -X POST "${API_URL}/api/v1/auth/register" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@fraud.local","password":"StrongPass123!","role":"admin"}')"

if [[ "${REGISTER_CODE}" != "201" && "${REGISTER_CODE}" != "409" ]]; then
  echo "Register verification failed (${REGISTER_CODE})."
  cat /tmp/azure-register.json
  exit 1
fi

LOGIN_JSON="$(curl -s -X POST "${API_URL}/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@fraud.local","password":"StrongPass123!"}')"

TOKEN="$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("token",""))' <<<"${LOGIN_JSON}")"
if [[ -z "${TOKEN}" ]]; then
  echo "Login verification failed."
  echo "${LOGIN_JSON}"
  exit 1
fi

TX_CODE="$(curl -s -o /tmp/azure-tx.json -w '%{http_code}' \
  -X POST "${API_URL}/api/v1/transactions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"transactionId\":\"azure-deploy-$(date +%s)\",\"userId\":\"azure-user-001\",\"amount\":92500,\"currency\":\"USD\",\"location\":\"London\",\"deviceId\":\"unknown-azure-device\",\"ipAddress\":\"127.0.0.1\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}")"

if [[ "${TX_CODE}" != "201" ]]; then
  echo "Transaction verification failed (${TX_CODE})."
  cat /tmp/azure-tx.json
  exit 1
fi

SIM_CODE="$(curl -s -o /tmp/azure-sim.json -w '%{http_code}' \
  -X POST "${API_URL}/api/v1/simulation/start" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"count":5}')"

if [[ "${SIM_CODE}" != "200" ]]; then
  echo "Simulation verification failed (${SIM_CODE})."
  cat /tmp/azure-sim.json
  exit 1
fi

echo
echo "Deployment completed successfully."
echo "Frontend URL: ${FRONTEND_URL}"
echo "API Gateway URL: ${API_URL}"
echo "ML Service URL: ${ML_SERVICE_URL}"
