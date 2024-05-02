FROM python:3.11.6

ENV PYTHONUNBUFFERED 1

RUN mkdir ssl
WORKDIR /backend

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		postgresql-client openssl\
	&& rm -rf /var/lib/apt/lists/*
RUN pip install --upgrade pip
RUN pip install python-decouple psycopg2-binary Pillow \
    Django django-cors-headers djangorestframework djangorestframework_simplejwt django-sslserver channels[daphne]
RUN openssl req -newkey rsa:4096 -x509 -sha256 -days 365 -nodes \
	-out /ssl/ssl.crt \
	-keyout /ssl/ssl.key \
	-subj "/C=FR/ST=Lyon/L=Lyon/O=42 School/OU=transcendence/CN=transcendence.42.fr"

COPY . /backend/

RUN chmod 777 waiting-db.sh

ENTRYPOINT ["./waiting-db.sh"]

CMD ["daphne", "-e", "ssl:8000:privateKey=/ssl/ssl.key:certKey=/ssl/ssl.crt", "backend.asgi:application"]
