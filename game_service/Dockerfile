FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./
RUN yarn install

COPY . .

RUN yarn compile

EXPOSE 3000

CMD ["yarn", "start"]