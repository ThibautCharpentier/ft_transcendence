#!/bin/bash

set -e

until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q'; do
  >&2 echo "database is unavailable - sleeping"
  sleep 1
done

>&2 echo "database is up !"
python manage.py makemigrations pong
python manage.py migrate
exec "$@"
