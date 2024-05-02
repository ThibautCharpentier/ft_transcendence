FROM node:alpine

RUN mkdir ssl
WORKDIR /frontend

RUN npm install -g http-server
RUN apk --no-cache add openssl
RUN openssl req -newkey rsa:4096 -x509 -sha256 -days 365 -nodes \
	-out /ssl/ssl.crt \
	-keyout /ssl/ssl.key \
	-subj "/C=FR/ST=Lyon/L=Lyon/O=42 School/OU=transcendence/CN=transcendence.42.fr"

COPY . /frontend/

CMD ["http-server", "-p", "8080", "-S", "-C", "/ssl/ssl.crt", "-K", "/ssl/ssl.key"]
