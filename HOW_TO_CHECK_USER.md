# איך לבדוק אם משתמש קיים במערכת

יש כמה דרכים לבדוק אם משתמש קיים במערכת:

## 1. דרך סקריפט Python (הכי קל) ✅

השתמש בסקריפט `check_user.py`:

```bash
# הפעל את ה-venv
.\venv\Scripts\Activate.ps1

# בדוק משתמש ספציפי לפי אימייל
python check_user.py <email>

# לדוגמה:
python check_user.py test@example.com

# לראות את כל המשתמשים במערכת
python check_user.py
```

הסקריפט יציג:
- ✅ האם המשתמש קיים
- פרטי המשתמש (username, email, שם מלא)
- סטטוס (is_active, is_approved, is_staff)
- פרטי Profile (תפקיד, יחידה)
- סטטוס Access Request
- האם המשתמש יכול לבקש OTP

---

## 2. דרך Django Admin (דרך GUI) 🌐

1. פתח את הדפדפן וגש ל: **http://localhost:8000/admin/**
2. התחבר עם משתמש admin
3. לחץ על **Users** בתפריט
4. חפש לפי:
   - Username
   - Email
   - First Name / Last Name
   - Phone

**יתרונות:**
- קל לשימוש
- ממשק גרפי נוח
- אפשר לראות ולערוך משתמשים

---

## 3. דרך Django Shell (דרך קוד) 💻

```bash
# הפעל את ה-venv
.\venv\Scripts\Activate.ps1

# פתח Django shell
python manage.py shell
```

ואז בקונסול:

```python
from django.contrib.auth import get_user_model
from core.models import Profile, AccessRequest

User = get_user_model()

# בדוק לפי אימייל
email = "test@example.com"
user = User.objects.filter(email=email).first()

if user:
    print(f"User found: {user.username}")
    print(f"Email: {user.email}")
    print(f"Is Approved: {user.is_approved}")
    print(f"Is Active: {user.is_active}")
    
    # בדוק Profile
    try:
        profile = user.profile
        print(f"Role: {profile.get_role_display()}")
        print(f"Unit: {profile.unit.name if profile.unit else 'N/A'}")
    except Profile.DoesNotExist:
        print("No profile found")
    
    # בדוק Access Request
    access_request = AccessRequest.objects.filter(user=user).first()
    if access_request:
        print(f"Access Request Status: {access_request.get_status_display()}")
else:
    print(f"User with email {email} not found")

# רשימת כל המשתמשים
all_users = User.objects.all()
for u in all_users:
    print(f"{u.username} - {u.email} - Approved: {u.is_approved}")

# חפש לפי username
user = User.objects.filter(username="testuser").first()

# חפש לפי email (case-insensitive)
user = User.objects.filter(email__iexact="test@example.com").first()
```

---

## 4. דרך API (דרך HTTP) 🌐

### בדיקה דרך API:

```bash
# בדוק אם משתמש קיים (דרך request-otp)
curl -X POST http://localhost:8000/api/auth/request-otp/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**תגובות אפשריות:**
- `200 OK` - המשתמש קיים ומאושר, OTP נשלח
- `400 Bad Request` - שגיאת validation (משתמש לא קיים או לא מאושר)
- `404 Not Found` - משתמש לא קיים
- `403 Forbidden` - משתמש לא מאושר

### דרך Admin API (דורש authentication):

```bash
# קבל רשימת משתמשים (דורש token)
curl -X GET http://localhost:8000/api/users/ \
  -H "Authorization: Bearer <your-token>"
```

---

## 5. דרך מסד הנתונים ישירות 🗄️

אם אתה משתמש ב-PostgreSQL:

```bash
# התחבר למסד הנתונים
psql -U postgres -d yirok_db

# חפש משתמש לפי אימייל
SELECT username, email, is_approved, is_active, date_joined 
FROM core_user 
WHERE email = 'test@example.com';

# רשימת כל המשתמשים
SELECT username, email, is_approved, is_active 
FROM core_user 
ORDER BY date_joined;

# בדוק Profile
SELECT u.username, u.email, p.role, u.is_approved
FROM core_user u
LEFT JOIN core_profile p ON u.id = p.user_id
WHERE u.email = 'test@example.com';
```

---

## סיבות נפוצות לשגיאת 400 ב-request-otp:

1. **משתמש לא קיים** - האימייל לא רשום במערכת
   - **פתרון**: המשתמש צריך להירשם קודם

2. **משתמש לא מאושר** - המשתמש קיים אבל `is_approved=False`
   - **פתרון**: מנהל צריך לאשר את המשתמש דרך Admin

3. **אימייל לא תקין** - פורמט האימייל שגוי
   - **פתרון**: בדוק שהאימייל בפורמט תקין (user@domain.com)

4. **נתונים לא נשלחים נכון** - בעיה ב-frontend
   - **פתרון**: בדוק את הקונסול של הדפדפן (F12)

---

## דוגמאות שימוש:

### בדוק משתמש ספציפי:
```bash
python check_user.py someoneimportant.spam@gmail.com
```

### רשימת כל המשתמשים:
```bash
python check_user.py
```

### בדוק דרך Shell:
```python
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.filter(email="test@example.com").exists()
True
```

---

## טיפים:

1. **השתמש בסקריפט `check_user.py`** - הכי קל ונוח
2. **בדוק את הלוגים** - `logs/django.log` מכיל מידע על כל הבקשות
3. **בדוק את הקונסול של הדפדפן** - F12 → Console
4. **בדוק את Admin Panel** - http://localhost:8000/admin/

---

## בעיות נפוצות:

### משתמש קיים אבל לא יכול לבקש OTP:
- ✅ בדוק ש-`is_approved = True`
- ✅ בדוק ש-`is_active = True`
- ✅ בדוק שיש Profile למשתמש

### משתמש לא מופיע ב-Admin:
- ✅ בדוק שהמשתמש לא נמחק
- ✅ בדוק שיש לך הרשאות admin
- ✅ בדוק את ה-filters ב-Admin

---

**נוצר על ידי:** Green Eyes System
**תאריך:** 2025-11-24


