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

RUN apt-get update

##################################################################

# install all node_modules, including dev
FROM base as deps

WORKDIR /remixapp/

ADD package.json package-lock.json ./
RUN npm install --production=false

##################################################################

# setup production node_modules
FROM base as production-deps

WORKDIR /remixapp/

COPY --from=deps /remixapp/node_modules /remixapp/node_modules
ADD package.json package-lock.json ./
RUN npm prune --production

##################################################################

# build remixapp
FROM base as build

WORKDIR /remixapp/

COPY --from=deps /remixapp/node_modules /remixapp/node_modules

# our app code changes all the time
ADD . .
RUN npm run build

##################################################################

# build smaller image for running
FROM base

WORKDIR /remixapp/

COPY --from=production-deps /remixapp/node_modules /remixapp/node_modules
COPY --from=build /remixapp/build /remixapp/build
COPY --from=build /remixapp/public /remixapp/public
ADD . .

CMD ["npm", "run", "start"]
