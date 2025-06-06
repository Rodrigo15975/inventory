###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:20-alpine As development
WORKDIR /usr/src/app
RUN apk add --no-cache openssl
COPY --chown=node:node package*.json ./  
RUN npm ci
COPY --chown=node:node . .  
COPY --chown=node:node prisma ./prisma  
RUN npx prisma generate
USER node

###################
# BUILD FOR PRODUCTION
###################

FROM node:20-alpine As build
WORKDIR /usr/src/app
RUN apk add --no-cache openssl
COPY --chown=node:node package*.json ./  
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules
COPY --chown=node:node . .  
COPY --chown=node:node --from=development /usr/src/app/prisma ./prisma


RUN npm run build
ENV NODE_ENV=production
RUN npm ci --omit=dev && npm cache clean --force

USER node

###################
# PRODUCTION
###################

FROM node:20-alpine As production
RUN apk add --no-cache openssl
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/package.json ./package.json
COPY --chown=node:node --from=build /usr/src/app/prisma ./prisma 
COPY --chown=node:node --from=build /usr/src/app/start.sh ./start.sh
RUN chmod +x ./start.sh
CMD ["./start.sh"]