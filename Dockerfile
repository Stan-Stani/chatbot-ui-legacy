# ---- Base Node ----
FROM node:23.11.1-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- Dependencies ----
FROM base AS dependencies
RUN npm ci

# ---- Build ----
FROM dependencies AS build
COPY . .

RUN NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT=PLACEHOLDER_NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT npm run build

# ---- Production ----
FROM node:23.11.1-alpine AS production
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package*.json ./
COPY --from=build /app/next.config.js ./next.config.js
COPY --from=build /app/next-i18next.config.js ./next-i18next.config.js
COPY --from=build /app/dockerScripts/entrypoint.sh ./dockerScripts/entrypoint.sh 

# Expose the port the app will run on
EXPOSE 3000

# Ensure entrypoint is executable
RUN chmod +x ./dockerScripts/entrypoint.sh

# Set Public Next JS envs. See https://stackoverflow.com/questions/71778031/nextjs-public-environment-variable-not-working-on-azure-app-service
ENTRYPOINT ["./dockerScripts/entrypoint.sh"]

# Start the application
CMD ["npm", "start"]
