FROM debian:buster

RUN apt-get update && apt-get -y upgrade && apt-get install -y --no-install-recommends nginx openssl && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /etc/nginx/ssl
RUN openssl req -newkey rsa:4096 -x509 -sha256 -days 365 -nodes \
	-out /etc/nginx/ssl/ssl.crt \
	-keyout /etc/nginx/ssl/ssl.key \
	-subj "/C=FR/ST=Lyon/L=Lyon/O=42 School/OU=transcendence/CN=transcendence.42.fr"

COPY nginx.conf /etc/nginx/conf.d

EXPOSE 8030

CMD ["nginx", "-g", "daemon off;"]
