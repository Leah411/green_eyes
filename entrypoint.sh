#!/bin/bash
set -e

DB_USER=${DB_USER:-postgres}

echo "Waiting for database..."
until pg_isready -h db -U "$DB_USER"; do
  echo "Database is unavailable - sleeping"
  sleep 1
done

echo "Database is up - running migrations..."
python manage.py migrate --noinput

echo "Starting Django server..."
exec python manage.py runserver 0.0.0.0:8000

