# Base stage for shared dependencies
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# Build stage to compile the React app
FROM base AS build
ARG APP_URL
ENV APP_URL=$APP_URL
COPY . .
RUN npm run build

# Production stage to serve the built assets
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package*.json ./
# Only install production dependencies
RUN npm install --omit=dev
COPY server.js ./
EXPOSE 9119
CMD ["node", "server.js"]
