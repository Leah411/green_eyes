# ירוק בעיניים (Green Eyes) - System Documentation

A comprehensive Django + Next.js application for organizational availability management with role-based access control, OTP authentication, and reporting capabilities.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [User Stories](#user-stories)

## ✨ Features

- **Role-Based Access Control (RBAC)**: Hierarchical organizational structure (Unit → Branch → Section → Team) with manager roles
- **User Approval Workflow**: Access requests require admin/manager approval before users can access the system
- **OTP Email Verification**: Secure login with email-based OTP codes (rate-limited, 6-digit codes)
- **Availability Reports**: Users can submit daily availability reports with status and notes
- **Manager Dashboards**: Different dashboards for unit managers, branch managers, section managers, and team managers
- **Excel Export**: Export availability reports to Excel format with filtering
- **Email Alerts**: Managers can send bulk email alerts with personalized links
- **Hebrew & English Support**: Full i18n support with RTL layout for Hebrew
- **Responsive UI**: Mobile-first design with Tailwind CSS
- **Security**: JWT authentication, rate limiting, password validation, CORS protection

## 🛠 Tech Stack

### Backend
- **Python 3.11**
- **Django 5.2.7** - Web framework
- **Django REST Framework** - API framework
- **djangorestframework-simplejwt** - JWT authentication
- **PostgreSQL 15** - Database
- **Gunicorn** - Production server
- **WhiteNoise** - Static file serving
- **Pandas & OpenPyXL** - Excel export
- **django-cors-headers** - CORS handling

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **react-i18next** - Internationalization
- **Axios** - HTTP client

### DevOps
- **Docker & Docker Compose** - Containerization
- **GitHub Actions** - CI/CD
- **Render / Railway** - Deployment platforms

## 📁 Project Structure

```
green_eyes/
├── core/                          # Main Django app
│   ├── models.py                 # User, Unit, Profile, AvailabilityReport, AccessRequest, OTPToken
│   ├── admin.py                  # Django admin configuration
│   ├── permissions.py            # Custom RBAC permissions
│   ├── api/
│   │   ├── views.py              # API endpoints
│   │   ├── serializers.py        # DRF serializers
│   │   └── urls.py               # API URL routing
│   ├── management/
│   │   └── commands/
│   │       ├── create_groups.py  # Create user groups
│   │       └── seed_data.py      # Seed sample data
│   ├── email_templates/          # HTML email templates
│   └── tests/                    # Unit and API tests
├── yirok_project/                # Django project settings
│   ├── settings.py               # Configuration
│   └── urls.py                   # Main URL config
├── frontend/                     # Next.js frontend
│   ├── pages/                    # Next.js pages
│   │   ├── index.tsx            # Login/Register
│   │   ├── verify-otp.tsx       # OTP verification
│   │   └── dashboard/           # Dashboard pages
│   ├── components/              # Reusable components
│   ├── lib/                     # Utilities (API client, i18n)
│   ├── i18n/                    # Translation files
│   └── styles/                  # Global styles
├── docker-compose.yml           # Docker Compose configuration
├── Dockerfile                   # Backend Dockerfile
├── requirements.txt             # Python dependencies
├── render.yaml                  # Render deployment config
├── .github/workflows/ci.yml     # GitHub Actions CI
└── README.md                    # This file
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- OR Python 3.11+ and Node.js 18+ for local development

### Option 1: Docker (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd green_eyes
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build and run:**
   ```bash
   docker-compose up --build
   ```

4. **Create superuser:**
   ```bash
   docker-compose exec web python manage.py createsuperuser
   ```

5. **Seed initial data:**
   ```bash
   docker-compose exec web python manage.py seed_data
   ```

6. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Admin Panel: http://localhost:8000/admin

### Option 2: Local Development

#### Backend Setup

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database and email settings
   ```

4. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Create superuser:**
   ```bash
   python manage.py createsuperuser
   ```

6. **Seed data:**
   ```bash
   python manage.py seed_data
   ```

7. **Run development server:**
   ```bash
   python manage.py runserver
   ```

#### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

## 🧪 Testing

### Backend Tests

```bash
# Run all tests
python manage.py test

# Run specific test file
python manage.py test core.tests.test_models
python manage.py test core.tests.test_api
```

### Frontend Tests

```bash
cd frontend
npm run lint
npm run build
```

### CI/CD

GitHub Actions automatically runs:
- Backend linting (flake8)
- Backend tests
- Frontend linting
- Frontend build

## 📦 Deployment

### Render.com

1. **Connect your repository** to Render
2. **Create a new Web Service** from `render.yaml`
3. **Set environment variables** in Render dashboard:
   - `SECRET_KEY`
   - `EMAIL_HOST`, `EMAIL_HOST_PASSWORD`, etc.
   - `CORS_ALLOWED_ORIGINS` (your frontend URL)
4. **Deploy**

### Railway

1. **Connect your repository** to Railway
2. **Create PostgreSQL database** service
3. **Create Web Service** for Django backend
4. **Create Web Service** for Next.js frontend
5. **Set environment variables** in Railway dashboard
6. **Deploy**

### Manual Deployment

1. **Build frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Collect static files:**
   ```bash
   python manage.py collectstatic --noinput
   ```

3. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

4. **Start with Gunicorn:**
   ```bash
   gunicorn yirok_project.wsgi:application --bind 0.0.0.0:8000
   ```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register/` - Register new user (creates AccessRequest)
- `POST /api/auth/login/` - Login with email/password
- `POST /api/auth/request-otp/` - Request OTP code (rate-limited)
- `POST /api/auth/verify-otp/` - Verify OTP and get JWT tokens
- `POST /api/auth/token/refresh/` - Refresh JWT access token

### Access Request Endpoints

- `GET /api/access-requests/` - List access requests (managers/admins)
- `POST /api/access-requests/{id}/approve/` - Approve access request
- `POST /api/access-requests/{id}/reject/` - Reject access request

### Reports Endpoints

- `GET /api/reports/` - List availability reports (RBAC filtered)
- `POST /api/reports/create/` - Create availability report
- `GET /api/reports/export/` - Export reports to Excel

### Alerts Endpoint

- `POST /api/alerts/send/` - Send email alerts (managers only)

### Other Endpoints

- `GET /api/health/` - Health check
- `GET /api/units/` - List organizational units
- `GET /api/users/` - List users (RBAC filtered)

## 👥 User Stories

### Story 1: User Registration and Approval

1. **Alice registers** via `POST /api/auth/register/`
   - Creates User with `is_approved=False`
   - Creates AccessRequest with status='pending'

2. **Admin approves** via `POST /api/access-requests/{id}/approve/`
   - Sets `user.is_approved=True`
   - Sends approval email
   - Generates and sends OTP code

3. **Alice requests OTP** via `POST /api/auth/request-otp/`
   - Receives 6-digit code via email

4. **Alice verifies OTP** via `POST /api/auth/verify-otp/`
   - Receives JWT access and refresh tokens
   - Can now access protected endpoints

### Story 2: Submit Availability Report

1. **Alice logs in** and navigates to dashboard
2. **Submits report** via `POST /api/reports/create/`
   - Date, status (available/unavailable/partial), notes
3. **Views past reports** via `GET /api/reports/`
4. **Manager exports** reports via `GET /api/reports/export/`

### Story 3: Manager Dashboard

1. **Manager logs in** (unit_manager, branch_manager, etc.)
2. **Views pending approvals** for their unit hierarchy
3. **Approves/rejects** access requests
4. **Views unit reports** (filtered by RBAC)
5. **Sends email alerts** to unit members

## 🔐 Security Features

- JWT token-based authentication
- OTP rate limiting (5 requests per hour per user)
- Password complexity validation
- CORS protection
- CSRF protection
- Secure headers (HSTS, X-Frame-Options, etc.)
- Email verification required
- Role-based access control with organizational hierarchy

## 🌐 Internationalization

- Hebrew (RTL) and English (LTR) support
- Language toggle in UI
- RTL-aware layouts
- Translated email templates

## 📝 Environment Variables

See `.env.example` for all required environment variables:

- Database: `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`
- Django: `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`
- Email: `EMAIL_HOST`, `EMAIL_HOST_PASSWORD`, etc.
- CORS: `CORS_ALLOWED_ORIGINS`
- Frontend: `NEXT_PUBLIC_API_URL`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

[Your License Here]

## 🆘 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for ירוק בעיניים**
