# בדיקת API ישירות - ללא Frontend

## שיטה 1: בדיקה בדפדפן (Network Tab)

1. פתח את ה-Frontend: `https://green-eyes-frontend.onrender.com`
2. לחץ **F12** (Developer Tools)
3. לך ל-**Network** tab
4. נסה לבקש OTP
5. חפש את הבקשה `request-otp`
6. לחץ עליה
7. לך ל-**Response** tab
8. תראה את השגיאה המדויקת

## שיטה 2: בדיקה ישירה ב-API

נסה לשלוח בקשה ישירה ל-API:

### Option A: Postman או Insomnia

1. פתח Postman/Insomnia
2. צור בקשה חדשה:
   - **Method**: `POST`
   - **URL**: `https://green-eyes-uaw4.onrender.com/api/auth/request-otp/`
   - **Headers**:
     ```
     Content-Type: application/json
     ```
   - **Body** (JSON):
     ```json
     {
       "email": "your-email@example.com"
     }
     ```
3. שלח את הבקשה
4. תראה את השגיאה המדויקת

### Option B: PowerShell/Command Line

```powershell
Invoke-RestMethod -Uri "https://green-eyes-uaw4.onrender.com/api/auth/request-otp/" -Method POST -ContentType "application/json" -Body '{"email":"your-email@example.com"}'
```

או עם curl:
```bash
curl -X POST https://green-eyes-uaw4.onrender.com/api/auth/request-otp/ -H "Content-Type: application/json" -d "{\"email\":\"your-email@example.com\"}"
```

## שיטה 3: בדוק Network Tab בדפדפן

1. פתח: `https://green-eyes-frontend.onrender.com`
2. לחץ **F12**
3. לך ל-**Network** tab
4. **רענן את הדף** (F5)
5. נסה לבקש OTP
6. חפש בקשות ל-`request-otp`
7. לחץ על הבקשה
8. בדוק:
   - **Status**: צריך להיות 500
   - **Response**: תראה את השגיאה
   - **Headers**: בדוק אם יש שגיאות

## שיטה 4: בדוק Console בדפדפן

1. פתח: `https://green-eyes-frontend.onrender.com`
2. לחץ **F12** → **Console** tab
3. נסה לבקש OTP
4. חפש שגיאות ב-Console
5. העתק את כל השגיאות

## מה לחפש

### ב-Network Tab:
- Status: `500 Internal Server Error`
- Response body: השגיאה המדויקת
- Headers: שגיאות נוספות

### ב-Console:
- שגיאות JavaScript
- שגיאות API
- שגיאות CORS

## אם עדיין לא רואה שגיאות

1. **נסה Console Backend** (כדי לבדוק אם זה Email):
   - Render Dashboard → Backend Service → Environment
   - שנה `EMAIL_BACKEND` ל: `django.core.mail.backends.console.EmailBackend`
   - שמור והמתן ל-Redeploy
   - נסה שוב

2. **בדוק אם יש משתמש ב-Database**:
   - האם יש משתמש עם ה-Email שאתה מנסה?
   - אם לא, זה יכול לגרום לשגיאה

3. **בדוק Environment Variables**:
   - ודא שכל משתני ה-Database מוגדרים
   - ודא ש-`SECRET_KEY` מוגדר

## מה לעשות עכשיו

1. ✅ פתח Network tab (F12 → Network)
2. ✅ נסה לבקש OTP
3. ✅ לחץ על הבקשה `request-otp`
4. ✅ העתק את ה-Response

או:

1. ✅ נסה Console Backend
2. ✅ נסה שוב
3. ✅ בדוק אם זה עובד

מה אתה רואה ב-Network tab כשאתה מנסה לבקש OTP?


