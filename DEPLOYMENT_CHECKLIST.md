# ✅ Deployment Checklist

Use this checklist when deploying your website.

## Pre-Deployment

- [ ] Code is committed and pushed to GitHub
- [ ] All tests pass locally
- [ ] `requirements.txt` is up to date
- [ ] `package.json` is up to date
- [ ] No sensitive data in code (no hardcoded secrets)

## Platform Setup

- [ ] Created account on Render/Railway
- [ ] Connected GitHub repository
- [ ] Created PostgreSQL database service
- [ ] Created Django backend service
- [ ] Created Next.js frontend service

## Environment Variables - Django Backend

### Required
- [ ] `SECRET_KEY` - Generated secure random key
- [ ] `DEBUG=False` - Production mode
- [ ] `ALLOWED_HOSTS` - Your domain(s), comma-separated

### Database (Auto-configured on Render)
- [ ] `DB_NAME` - Database name
- [ ] `DB_USER` - Database user
- [ ] `DB_PASS` - Database password
- [ ] `DB_HOST` - Database host
- [ ] `DB_PORT` - Database port (usually 5432)

### Email Configuration
- [ ] `EMAIL_HOST` - SMTP server (e.g., smtp.gmail.com or smtp.sendgrid.net)
- [ ] `EMAIL_PORT` - SMTP port (usually 587)
- [ ] `EMAIL_USE_TLS=True` - Use TLS encryption
- [ ] `EMAIL_HOST_USER` - SMTP username (or 'apikey' for SendGrid)
- [ ] `EMAIL_HOST_PASSWORD` - SMTP password or API key
- [ ] `DEFAULT_FROM_EMAIL` - Sender email address

### CORS
- [ ] `CORS_ALLOWED_ORIGINS` - Frontend URL (e.g., https://your-frontend.onrender.com)

### Optional
- [ ] `OTP_RATE_LIMIT` - Default: 5
- [ ] `OTP_EXPIRY_MINUTES` - Default: 10
- [ ] `SENTRY_DSN` - For error tracking (optional)

## Environment Variables - Frontend

- [ ] `NEXT_PUBLIC_API_URL` - Backend API URL (e.g., https://your-backend.onrender.com)

## Post-Deployment

- [ ] Services are "Live" / "Active"
- [ ] Database migrations completed
- [ ] Created superuser account
- [ ] Created user groups (`python manage.py create_groups`)
- [ ] Seeded initial data (optional)

## Testing

- [ ] Frontend loads at URL
- [ ] Can access backend API at `/api/health/`
- [ ] Can register new user
- [ ] Can request OTP code
- [ ] OTP email received
- [ ] Can verify OTP and login
- [ ] Admin panel accessible at `/admin`
- [ ] Can create availability report
- [ ] CORS working (no errors in browser console)
- [ ] Static files loading correctly

## Security

- [ ] `DEBUG=False` in production
- [ ] Strong `SECRET_KEY` set
- [ ] `ALLOWED_HOSTS` configured correctly
- [ ] HTTPS enabled (automatic on Render/Railway)
- [ ] No sensitive data in logs
- [ ] Email credentials secure

## Monitoring

- [ ] Checked application logs
- [ ] Set up error tracking (optional - Sentry)
- [ ] Verified email sending works
- [ ] Tested all major features

## Custom Domain (Optional)

- [ ] Added custom domain in platform settings
- [ ] Updated `ALLOWED_HOSTS` with custom domain
- [ ] Updated `CORS_ALLOWED_ORIGINS` with custom domain
- [ ] Updated `NEXT_PUBLIC_API_URL` if needed
- [ ] DNS records configured
- [ ] SSL certificate active

---

## Quick Commands Reference

### Generate Secret Key
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Create Superuser (via platform shell)
```bash
python manage.py createsuperuser
```

### Create Groups
```bash
python manage.py create_groups
```

### Seed Data
```bash
python manage.py seed_data
```

### Run Migrations
```bash
python manage.py migrate
```

### Collect Static Files
```bash
python manage.py collectstatic --noinput
```

---

**Save this checklist and check off items as you complete them!**






