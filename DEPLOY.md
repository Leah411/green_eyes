# Deployment Guide for Render

## Prerequisites

1. Create a Render account at https://render.com
2. Connect your GitHub repository to Render

## Environment Variables

Set these environment variables in the Render dashboard for your web service:

### Required Variables
- `SECRET_KEY` - Django secret key (generate a new one for production)
- `ALLOWED_HOSTS` - Comma-separated list of allowed hosts (e.g., `your-app.onrender.com,www.your-app.com`)
- `DEBUG` - Set to `False` for production

### Database Variables (Auto-configured)
The database variables are automatically configured from the PostgreSQL service:
- `DB_NAME` - Auto-set from database
- `DB_USER` - Auto-set from database
- `DB_PASS` - Auto-set from database
- `DB_HOST` - Auto-set from database
- `DB_PORT` - Auto-set from database

### Email Variables (Optional)
- `EMAIL_HOST` - SMTP host (default: smtp.sendgrid.net)
- `EMAIL_PORT` - SMTP port (default: 587)
- `EMAIL_USE_TLS` - Set to `True` or `False`
- `EMAIL_HOST_USER` - SMTP username
- `EMAIL_HOST_PASSWORD` - SMTP password
- `DEFAULT_FROM_EMAIL` - Default sender email

## Deployment Steps

1. **Push your code to GitHub** (if not already done)

2. **Create a new Web Service on Render:**
   - Click "New +" → "Web Service"
   - Connect your repository
   - Render will detect `render.yaml` automatically

3. **The `render.yaml` file will:**
   - Create a PostgreSQL database automatically
   - Configure the web service with proper build and start commands
   - Link environment variables from the database

4. **Set Environment Variables:**
   - Go to your web service settings
   - Add the required environment variables listed above

5. **Deploy:**
   - Render will automatically build and deploy your application
   - Run migrations automatically on first deploy

## Post-Deployment

1. **Create a superuser:**
   ```bash
   # Use Render's shell or SSH
   python manage.py createsuperuser
   ```

2. **Create user groups:**
   ```bash
   python manage.py create_groups
   ```

3. **Verify your application is running:**
   - Check the logs for any errors
   - Visit your application URL

## Notes

- The Dockerfile is included for Docker-based deployments (optional)
- Static files are served via WhiteNoise
- The application uses Gunicorn as the WSGI server
- Database migrations run automatically on deployment

