FROM node:14 AS builder
WORKDIR /app
COPY package.json yarn.lock /app/
RUN yarn
COPY . /app
RUN yarn build && yarn --production

FROM gcr.io/distroless/nodejs:14
WORKDIR /app
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
CMD ["/app/dist/main.js"]
