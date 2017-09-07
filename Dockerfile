FROM node:7.10.1
EXPOSE 8888
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . /usr/src/app

RUN npm prune && npm install

RUN /usr/src/app/node_modules/roleHaven/start.sh
CMD ["npm", "start"]
