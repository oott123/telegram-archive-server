FROM node:18 AS builder
WORKDIR /app
COPY package.json yarn.lock /app/
RUN yarn
COPY . /app
RUN yarn build && yarn --production

FROM gcr.io/distroless/nodejs:18
WORKDIR /app
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/public /app/public
CMD ["/app/dist/main.js"]
