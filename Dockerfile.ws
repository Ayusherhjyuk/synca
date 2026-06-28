# ─────────────────────────────────────────────────────────────────────────
# Standalone Yjs WebSocket sync server.
#
# The Next.js app deploys to Vercel; this container hosts the persistent
# WebSocket server (which Vercel's serverless runtime can't keep alive).
# Deploy to Railway / Render / Fly.io.
#
#   docker build -f Dockerfile.ws -t collab-ws .
#   docker run -p 1234:1234 --env-file .env.local collab-ws
#
# Required env at runtime: MONGODB_URI, AUTH_SECRET, WS_PORT (optional).
# ─────────────────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install dependencies (tsx is needed to run the TypeScript server directly).
COPY package*.json ./
RUN npm ci

# Copy only what the server needs.
COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production
EXPOSE 1234

CMD ["npm", "run", "ws:start"]
