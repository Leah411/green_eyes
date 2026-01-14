# API Endpoints Summary

## Available Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login with email/password
- `POST /api/auth/request-otp/` - Request OTP code
- `POST /api/auth/verify-otp/` - Verify OTP and get token
- `POST /api/auth/token/refresh/` - Refresh JWT token

### Health Check
- `GET /api/health/` - Simple health check (no DB checks)

### Access Requests
- `GET /api/access-requests/` - List access requests (Manager only)
- `POST /api/access-requests/<id>/approve/` - Approve access request
- `POST /api/access-requests/<id>/reject/` - Reject access request

### Reports
- `GET /api/reports/` - List reports
- `POST /api/reports/create/` - Create report
- `GET /api/reports/export/` - Export reports

### Alerts
- `POST /api/alerts/send/` - Send alert (Manager only)

### ViewSets (REST API)
- `GET /api/users/` - List users
- `GET /api/profiles/` - List profiles
- `GET /api/units/` - List units
- `GET /api/locations/` - List locations
- `GET /api/reports/` - List reports (ViewSet)
- `GET /api/access-requests/` - List access requests (ViewSet)

## Base URL
- Production: `https://green-eyes-uaw4.onrender.com`
- Local: `http://localhost:8000`

## Example Usage

### Health Check
```bash
curl https://green-eyes-uaw4.onrender.com/api/health/
```

### Request OTP
```bash
curl -X POST https://green-eyes-uaw4.onrender.com/api/auth/request-otp/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Register
```bash
curl -X POST https://green-eyes-uaw4.onrender.com/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "first_name": "John", "last_name": "Doe"}'
```

