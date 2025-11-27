# Deployment Guide

This document provides detailed instructions for deploying the ירוק בעיניים (Green Eyes) system to various platforms.

## Prerequisites

- Git repository with the code
- Database (PostgreSQL)
- Email service (SendGrid, Mailgun, or similar)
- Domain name (optional)

## Environment Variables

Before deploying, ensure you have the following environment variables configured:

### Required Variables

```bash
# Database
DB_NAME=yirok_db
DB_USER=your_db_user
DB_PASS=your_db_password
DB_HOST=your_db_host
DB_PORT=5432

# Django
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@your-domain.com

# CORS
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com

# Frontend
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

## Render.com Deployment

### Step 1: Create Services

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect your Git repository
4. Select `render.yaml` from the repository

### Step 2: Configure Database

1. Render will automatically create a PostgreSQL database
2. Database credentials will be automatically injected as environment variables

### Step 3: Set Environment Variables

In each service (Django and Frontend), set the required environment variables:

- Django service: All backend variables
- Frontend service: `NEXT_PUBLIC_API_URL` pointing to your Django service URL

### Step 4: Deploy

1. Render will automatically build and deploy
2. Wait for build to complete
3. Access your services at the provided URLs

### Step 5: Initial Setup

After deployment, run:

```bash
# SSH into your Django service
render ssh <service-name>

# Run migrations (if not in build command)
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Seed data
python manage.py seed_data
```

## Railway Deployment

### Step 1: Create Project

1. Go to [Railway Dashboard](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"

### Step 2: Add Services

1. **PostgreSQL Database:**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will provide connection details

2. **Django Backend:**
   - Click "New" → "GitHub Repo"
   - Select your repository
   - Set start command: `gunicorn yirok_project.wsgi:application --bind 0.0.0.0:$PORT`
   - Set build command: `pip install -r requirements.txt && python manage.py collectstatic --noinput`

3. **Next.js Frontend:**
   - Click "New" → "GitHub Repo"
   - Select your repository
   - Set root directory: `frontend`
   - Set start command: `npm start`
   - Set build command: `npm install && npm run build`

### Step 3: Configure Environment Variables

For Django service:
- Add all backend environment variables
- Link PostgreSQL database variables

For Frontend service:
- `NEXT_PUBLIC_API_URL`: Your Django service URL

### Step 4: Deploy

Railway will automatically deploy on every push to main branch.

## Docker Deployment

### Step 1: Build Images

```bash
# Build backend
docker build -t yirok-backend .

# Build frontend
cd frontend
docker build -t yirok-frontend .
cd ..
```

### Step 2: Run with Docker Compose

```bash
# Update docker-compose.yml with production settings
docker-compose -f docker-compose.prod.yml up -d
```

### Step 3: Run Migrations

```bash
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser
docker-compose exec web python manage.py seed_data
```

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Superuser created
- [ ] Sample data seeded
- [ ] Email service configured and tested
- [ ] CORS settings configured
- [ ] SSL certificates installed (HTTPS)
- [ ] Environment variables set correctly
- [ ] Health check endpoint working (`/api/health/`)
- [ ] Frontend can connect to backend API
- [ ] OTP emails are being sent
- [ ] Admin panel accessible

## Monitoring

### Health Checks

- Backend: `GET /api/health/`
- Frontend: Root URL should load

### Logs

- Render: View logs in service dashboard
- Railway: View logs in service dashboard
- Docker: `docker-compose logs -f`

## Troubleshooting

### Database Connection Issues

- Verify database credentials
- Check database is accessible from your service
- Ensure database exists and user has permissions

### Email Not Sending

- Verify email service credentials
- Check email service logs
- Test with console backend first: `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend`

### CORS Errors

- Verify `CORS_ALLOWED_ORIGINS` includes your frontend URL
- Check that frontend `NEXT_PUBLIC_API_URL` matches backend URL

### Static Files Not Loading

- Run `python manage.py collectstatic --noinput`
- Verify `STATIC_ROOT` is set correctly
- Check WhiteNoise middleware is enabled

## Scaling

### Horizontal Scaling

- Use load balancer for multiple Django instances
- Use shared database (PostgreSQL)
- Use shared cache (Redis) for session storage

### Database Scaling

- Use read replicas for read-heavy operations
- Optimize queries with proper indexing
- Consider connection pooling (PgBouncer)

## Backup Strategy

1. **Database Backups:**
   - Automated daily backups (Render/Railway provide this)
   - Manual backup: `pg_dump` command

2. **Code Backups:**
   - Git repository is the source of truth
   - Tag releases for easy rollback

3. **Media Files:**
   - Use cloud storage (S3, Cloudinary) for user uploads
   - Configure `MEDIA_ROOT` accordingly

## Security Checklist

- [ ] `DEBUG=False` in production
- [ ] `SECRET_KEY` is strong and unique
- [ ] `ALLOWED_HOSTS` is set correctly
- [ ] HTTPS enabled (SSL certificates)
- [ ] Database credentials are secure
- [ ] Email credentials are secure
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Security headers are set
- [ ] Regular security updates applied
