FROM node:15-alpine
WORKDIR /usr/src/memehub-webserver
COPY package*.json ./
RUN npm install
COPY *.js ./
EXPOSE 80
CMD [ "node", "index.js" ]