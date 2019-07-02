FROM node:12

WORKDIR /usr/src/app

COPY package.json .
COPY yarn.lock .

RUN yarn install

COPY . .

EXPOSE 8080

RUN ./node_modules/gulp/bin/gulp.js

CMD ["node", "index.js"]