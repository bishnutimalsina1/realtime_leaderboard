FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./
RUN yarn install

COPY . .

RUN yarn compile

ENV KAFKA_BROKERS=kafka:9092

EXPOSE 3000

CMD ["yarn", "start"]