# פתרון שגיאת 500 - שלב אחר שלב

## הבעיה
שגיאת 500 כשמנסים לבקש OTP:
```
POST https://green-eyes-uaw4.onrender.com/api/auth/request-otp/ 500 (Internal Server Error)
```

## שלב 1: בדוק Backend Logs (חשוב מאוד!)

### איך לבדוק Logs:

1. לך ל-[Render Dashboard](https://dashboard.render.com)
2. פתח את ה-Backend Service (`green-eyes` או `yirok-django`)
3. לחץ על הטאב **"Logs"** (בחלק העליון)
4. גלול למטה לראות את השגיאות האחרונות
5. חפש שגיאות שקשורות ל:
   - `request-otp`
   - `email`
   - `smtp`
   - `send_mail`
   - `EMAIL_HOST_PASSWORD`

### מה לחפש:

חפש שורות אדומות או שגיאות כמו:
```
Error sending OTP email
SMTPAuthenticationError
Connection refused
Invalid credentials
ModuleNotFoundError
```

**העתק את השגיאה המדויקת** - זה יעזור לזהות את הבעיה!

## שלב 2: בדוק תצורת Email

### איפה לבדוק:

1. Backend Service → **Environment** tab
2. בדוק את כל משתני ה-Email:

```
EMAIL_BACKEND = django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = your-email@gmail.com
EMAIL_HOST_PASSWORD = your-app-password
DEFAULT_FROM_EMAIL = your-email@gmail.com
```

### בעיות נפוצות:

#### בעיה 1: משתנה חסר
- **סימן:** שגיאה ב-Logs: `EMAIL_HOST_PASSWORD not set`
- **פתרון:** הוסף את המשתנה החסר

#### בעיה 2: Gmail App Password שגוי
- **סימן:** שגיאה: `SMTPAuthenticationError` או `Invalid credentials`
- **פתרון:** 
  1. לך ל: https://myaccount.google.com/apppasswords
  2. צור App Password חדש
  3. העתק את ה-16 תווים (ללא רווחים)
  4. עדכן את `EMAIL_HOST_PASSWORD` ב-Render

#### בעיה 3: EMAIL_HOST_USER ו-DEFAULT_FROM_EMAIL לא זהים
- **סימן:** שגיאה: `Sender address rejected`
- **פתרון:** ודא ששניהם זהים בדיוק

#### בעיה 4: משתמש בסיסמה רגילה במקום App Password
- **סימן:** שגיאה: `Username and Password not accepted`
- **פתרון:** חייב להשתמש ב-Gmail App Password, לא בסיסמה הרגילה

## שלב 3: פתרון זמני - Console Backend

אם אתה רוצה לבדוק שהכל עובד בלי Email:

1. Backend Service → **Environment** tab
2. מצא `EMAIL_BACKEND`
3. שנה ל:
   ```
   django.core.mail.backends.console.EmailBackend
   ```
4. לחץ **"Save Changes"**
5. המתן ל-Redeploy (2-3 דקות)
6. נסה שוב לבקש OTP
7. לך ל-Logs - ה-OTP יופיע שם במקום להישלח ב-Email

**אם זה עובד עם Console Backend**, אז הבעיה היא ב-Email configuration.

## שלב 4: תיקון תצורת Gmail

אם אתה משתמש ב-Gmail:

### צור Gmail App Password:

1. לך ל: https://myaccount.google.com/apppasswords
2. אם אתה לא רואה את האפשרות:
   - ודא ש-2FA מופעל: https://myaccount.google.com/security
   - הפעל 2-Step Verification
3. צור App Password:
   - בחר "Mail"
   - בחר "Other (Custom name)"
   - הקלד: "Green Eyes"
   - לחץ "Generate"
4. העתק את ה-16 תווים (נראה כך: `abcd efgh ijkl mnop`)
5. הסר את הרווחים: `abcdefghijklmnop`

### עדכן ב-Render:

1. Backend Service → **Environment** tab
2. עדכן `EMAIL_HOST_PASSWORD` ל-App Password החדש
3. ודא ש-`EMAIL_HOST_USER` = כתובת ה-Gmail שלך
4. ודא ש-`DEFAULT_FROM_EMAIL` = אותה כתובת בדיוק
5. לחץ **"Save Changes"**
6. המתן ל-Redeploy

## שלב 5: בדיקה

אחרי ה-Redeploy:

1. נסה שוב לבקש OTP מה-Frontend
2. בדוק את ה-Logs - האם יש שגיאות?
3. בדוק את תיבת הדואר - האם קיבלת את ה-OTP?

## סיכום - מה לעשות עכשיו

1. ✅ **בדוק Backend Logs** - מה השגיאה המדויקת?
2. ✅ **בדוק Environment Variables** - האם כל משתני ה-Email מוגדרים?
3. ✅ **נסה Console Backend** - האם זה עובד?
4. ✅ **תקן Gmail App Password** - אם צריך
5. ✅ **Redeploy** - אחרי כל שינוי

## אם עדיין לא עובד

שלח לי:
1. **השגיאה המדויקת מה-Logs** (העתק את כל השורה)
2. **רשימה של כל משתני ה-Email** שיש לך (בלי הסיסמאות!)
3. **האם ניסית Console Backend?** האם זה עבד?

עם המידע הזה אוכל לעזור לך לפתור את הבעיה במדויק!


