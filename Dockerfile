# base node image
FROM node:18-bullseye-slim as base

# set for base and all that inherit from it
ARG RAILWAY_STATIC_URL
ARG RAILWAY_GIT_COMMIT_SHA
ARG RAILWAY_GIT_AUTHOR
ARG RAILWAY_GIT_BRANCH
ARG RAILWAY_GIT_REPO_NAME
ARG RAILWAY_GIT_REPO_OWNER
ARG RAILWAY_GIT_COMMIT_MESSAGE
ARG RAILWAY_ENVIRONMENT
ARG RAILWAY=false
ENV NODE_ENV=production

# install openssl for Prisma
RUN apt-get update && apt-get install -y openssl

##################################################################

# install all node_modules, including devDependencies
FROM base as deps

WORKDIR /workdir/

ADD package.json package-lock.json ./
RUN npm install --production=false

##################################################################

# setup production node_modules
FROM base as production-deps

WORKDIR /workdir/

COPY --from=deps /workdir/node_modules /workdir/node_modules
ADD package.json package-lock.json ./
RUN npm prune --production

##################################################################

# build the app
FROM base as build

WORKDIR /workdir/

COPY --from=deps /workdir/node_modules /workdir/node_modules

ADD prisma .
RUN npx prisma generate

ADD . .
RUN npm run build

##################################################################

# finally, build the production image with minimal footprint
FROM base

WORKDIR /workdir/

COPY --from=production-deps /workdir/node_modules /workdir/node_modules
COPY --from=build /workdir/node_modules/.prisma /workdir/node_modules/.prisma
COPY --from=build /workdir/build /workdir/build
COPY --from=build /workdir/public /workdir/public
COPY --from=build /workdir/prisma /workdir/prisma
COPY --from=build /workdir/package.json /workdir/package.json
COPY --from=build /workdir/remix.config.js /workdir/remix.config.js
COPY ./scripts/start_with_migrations.sh ./scripts/start_with_migrations.sh

ENTRYPOINT [ "./scripts/start_with_migrations.sh" ]
