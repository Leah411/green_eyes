# פתרון שגיאת 500 ב-Request OTP

## הבעיה
שגיאת 500 (Internal Server Error) כשמנסים לבקש OTP.

## סיבות אפשריות

### 1. תצורת Email לא מוגדרת נכון

השגיאה כנראה נובעת מבעיה בשליחת Email. בדוק ב-Render Dashboard:

**ב-Backend Service → Environment:**

ודא שיש את כל המשתנים הבאים:

```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

**חשוב:**
- `EMAIL_HOST_USER` ו-`DEFAULT_FROM_EMAIL` חייבים להיות אותו Email
- `EMAIL_HOST_PASSWORD` חייב להיות Gmail App Password (לא הסיסמה הרגילה)
- כל המשתנים חייבים להיות מוגדרים

### 2. בדוק Backend Logs

1. לך ל-Render Dashboard
2. פתח את ה-Backend Service
3. לך ל-**Logs** tab
4. חפש שגיאות שקשורות ל-Email או ל-request-otp
5. העתק את השגיאה המדויקת

### 3. פתרון זמני: השתמש ב-Console Backend

אם אתה רוצה לבדוק שהכל עובד בלי Email:

1. ב-Render Dashboard → Backend Service → Environment
2. שנה:
   ```
   EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
   ```
3. שמור והפעל מחדש
4. עכשיו ה-OTP יופיע ב-Logs במקום להישלח ב-Email

### 4. בדוק משתני סביבה חסרים

ודא שיש את כל המשתנים הבאים:

**חובה:**
- `SECRET_KEY`
- `DEBUG` (צריך להיות `False` ב-production)
- `ALLOWED_HOSTS`
- כל משתני ה-Database (`DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`)
- כל משתני ה-Email (כפי שמופיע למעלה)

## שלבים לפתרון

### שלב 1: בדוק Logs
1. לך ל-Backend Service → Logs
2. חפש את השגיאה המדויקת
3. העתק אותה

### שלב 2: בדוק Email Configuration
1. ודא שכל משתני ה-Email מוגדרים
2. ודא ש-`EMAIL_HOST_PASSWORD` הוא Gmail App Password
3. ודא ש-`EMAIL_HOST_USER` ו-`DEFAULT_FROM_EMAIL` זהים

### שלב 3: נסה Console Backend
1. שנה `EMAIL_BACKEND` ל-`django.core.mail.backends.console.EmailBackend`
2. שמור והפעל מחדש
3. נסה שוב - אם זה עובד, הבעיה היא ב-Email configuration

### שלב 4: בדוק Gmail App Password
אם אתה משתמש ב-Gmail:
1. לך ל: https://myaccount.google.com/apppasswords
2. ודא שיש לך App Password
3. ודא שאתה משתמש ב-App Password (16 תווים), לא בסיסמה הרגילה

## מה לבדוק עכשיו

1. **Backend Logs** - מה השגיאה המדויקת?
2. **Environment Variables** - האם כל משתני ה-Email מוגדרים?
3. **Gmail App Password** - האם אתה משתמש ב-App Password?

## אם עדיין לא עובד

שלח לי:
1. השגיאה המדויקת מה-Logs
2. רשימה של כל משתני ה-Environment (בלי הסיסמאות!)
3. האם אתה משתמש ב-Gmail או שירות אחר?


