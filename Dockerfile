# docker build -t teambeat .
# docker run -p 8080:8080 teambeat
# docker run -p 8080:8080 -v "$(pwd)"/pb/pb_data:/pb/pb_data teambeat
# pb/pocketbase serve --http=localhost:8080 --dir pb/pb_data/

FROM node:19-alpine

WORKDIR /usr/src/app

COPY svelte.config.js ./
COPY vite.config.js ./
COPY package*.json ./

RUN npm install

COPY ./src ./src
COPY ./static ./static

RUN npm run build


FROM alpine:latest

ARG PB_VERSION=0.11.4

RUN apk add --no-cache \
    unzip \
    ca-certificates

# download and unzip PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

EXPOSE 8080

COPY --from=0 /usr/src/app/build ./build

# start PocketBase
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080", "--publicDir", "build"]
