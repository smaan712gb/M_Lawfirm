FROM node:24.22.1-alpine
WORKDIR /app
COPY package.json server.mjs mcp-server.mjs ./
COPY lib ./lib
COPY dist ./dist
COPY scripts ./scripts
RUN mkdir -p /app/.data && chown -R node:node /app
USER node
ENV HOST=0.0.0.0 PORT=3333 DATA_DIR=/app/.data
EXPOSE 3333
CMD ["node","server.mjs"]
