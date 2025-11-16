# 🔐 Authentication Setup Guide

This guide explains how to set up Email OTP verification and CAPTCHA for the Smart HES System.

---

## 📧 Email OTP Setup

The system supports email-based OTP (One-Time Password) authentication for enhanced security.

### Features:
- ✅ 6-digit OTP codes sent to registered email
- ✅ 10-minute expiration time
- ✅ Maximum 3 verification attempts
- ✅ Resend OTP functionality (60-second cooldown)
- ✅ Beautiful HTML email templates
- ✅ Rate limiting to prevent abuse

### Backend Setup:

#### 1. Install Dependencies

```bash
cd smaer-hes-backend
npm install nodemailer
```

#### 2. Configure Email Service

Update your `.env` file with SMTP credentials:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_NAME=New Hampshire Capital
```

#### 3. Gmail App Password Setup (Recommended)

If using Gmail:

1. Go to Google Account Settings → Security
2. Enable 2-Step Verification
3. Go to App Passwords: https://myaccount.google.com/apppasswords
4. Generate app password for "Mail"
5. Use the generated password in `SMTP_PASSWORD`

#### 4. Other Email Providers

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
```

**Yahoo:**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
```

**Custom SMTP:**
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
```

### Frontend Setup:

No additional configuration needed for email OTP. The login page automatically supports both password and OTP-based authentication.

---

## 🤖 CAPTCHA Setup

The system supports Google reCAPTCHA (v2 and v3) to prevent automated bot attacks.

### Features:
- ✅ Google reCAPTCHA v2 (Checkbox)
- ✅ Optional - can be toggled on/off
- ✅ Fallback if CAPTCHA service is unavailable
- ✅ Clean integration with login flow

### Setup Instructions:

#### 1. Get reCAPTCHA Keys

1. Visit: https://www.google.com/recaptcha/admin/create
2. Register your site:
   - **Label:** Smart HES System
   - **reCAPTCHA type:** reCAPTCHA v2 (Checkbox recommended)
   - **Domains:**
     - `localhost` (for development)
     - `your-domain.com` (for production)
3. Click "Submit"
4. Copy both **Site Key** and **Secret Key**

#### 2. Configure Backend

Add to `.env`:

```env
RECAPTCHA_SECRET_KEY=your-secret-key-from-google
```

#### 3. Configure Frontend

Create `.env` file in `smart-hes-frontend/`:

```env
REACT_APP_RECAPTCHA_SITE_KEY=your-site-key-from-google
```

#### 4. Install Frontend Dependency

```bash
cd smart-hes-frontend
npm install react-google-recaptcha
npm install --save-dev @types/react-google-recaptcha
```

### Testing with Test Keys

For development, you can use Google's test keys:

- **Site Key:** `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
- **Secret Key:** `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

**Note:** Test keys always pass validation but show a warning.

---

## 🚀 Using the Authentication System

### Regular Password Login:

1. Navigate to login page
2. Select "Password Login" tab
3. Enter username and password
4. Complete CAPTCHA (if enabled)
5. Click "Sign In"

### OTP-Based Login:

1. Navigate to login page
2. Select "OTP Login" tab
3. Enter email or username
4. Click "Send OTP"
5. Check your email for the 6-digit code
6. Enter the OTP code
7. Click "Verify & Sign In"

### API Endpoints:

#### Request OTP:
```bash
POST /api/auth/request-otp
Content-Type: application/json

{
  "email": "user@example.com"
  // OR
  "username": "user123"
}
```

#### Verify OTP:
```bash
POST /api/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "password": "optional-password" // Optional: for dual verification
}
```

#### Resend OTP:
```bash
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Verify CAPTCHA:
```bash
POST /api/auth/verify-captcha
Content-Type: application/json

{
  "captchaToken": "token-from-recaptcha"
}
```

---

## 🔒 Security Best Practices

### For Production:

1. **Use Strong SMTP Passwords:**
   - Never commit credentials to git
   - Use environment variables
   - Rotate passwords regularly

2. **Enable CAPTCHA:**
   - Always enable in production
   - Use reCAPTCHA v3 for invisible protection
   - Monitor CAPTCHA score thresholds

3. **Rate Limiting:**
   - OTP requests: Max 1 per 60 seconds per email
   - Login attempts: Implement account lockout after 5 failed attempts
   - CAPTCHA: Required after 3 failed login attempts

4. **Email Security:**
   - Use TLS/SSL for SMTP connections
   - Validate email addresses
   - Implement SPF, DKIM, and DMARC records

5. **OTP Security:**
   - 10-minute expiration (default)
   - Single-use only
   - Secure random generation
   - Maximum 3 verification attempts

---

## 🧪 Testing

### Test OTP Flow:

```bash
# 1. Start backend
cd smaer-hes-backend
npm run dev

# 2. Request OTP
curl -X POST http://localhost:5000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smarthes.com"}'

# 3. Check your email for OTP

# 4. Verify OTP
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smarthes.com","otp":"123456"}'
```

### Test CAPTCHA:

1. Open login page in browser
2. Enable CAPTCHA checkbox
3. Complete reCAPTCHA challenge
4. Verify network tab shows successful CAPTCHA verification

---

## 📝 Troubleshooting

### Email OTP Issues:

**Problem:** OTP emails not sending

**Solutions:**
1. Check SMTP credentials in `.env`
2. Verify app password (for Gmail)
3. Check firewall/antivirus blocking port 587/465
4. Test SMTP connection:
   ```bash
   telnet smtp.gmail.com 587
   ```
5. Check backend logs for email errors

**Problem:** OTP expired

**Solution:** OTPs expire after 10 minutes. Request a new one.

**Problem:** "Too many attempts"

**Solution:** Wait for cooldown (60 seconds) or request new OTP.

### CAPTCHA Issues:

**Problem:** CAPTCHA not loading

**Solutions:**
1. Verify `REACT_APP_RECAPTCHA_SITE_KEY` in frontend `.env`
2. Check browser console for errors
3. Verify domain is registered in reCAPTCHA admin
4. Try using test keys first

**Problem:** "CAPTCHA verification failed"

**Solutions:**
1. Verify `RECAPTCHA_SECRET_KEY` in backend `.env`
2. Check backend logs for verification errors
3. Ensure backend can reach Google's API (no firewall blocking)

---

## 🎨 Customization

### Customize OTP Email Template:

Edit `/smaer-hes-backend/src/services/email.service.ts`:

```typescript
async sendOTP(email: string, otp: string, username: string) {
  const html = `
    <!-- Your custom HTML template -->
    <div style="text-align: center;">
      <h1>Your OTP: ${otp}</h1>
    </div>
  `;
  // ...
}
```

### Change OTP Expiration Time:

Edit `/smaer-hes-backend/src/services/otp.service.ts`:

```typescript
const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
```

### Make CAPTCHA Mandatory:

Edit `/smart-hes-frontend/src/pages/Auth/Login.tsx`:

```typescript
const [captchaRequired, setCaptchaRequired] = useState(true); // Always true
// Remove or hide the toggle checkbox
```

---

## 📚 Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Google reCAPTCHA Documentation](https://developers.google.com/recaptcha/docs/display)
- [SMTP Configuration Guide](https://www.siteground.com/kb/gmail_smtp/)
- [Email Security Best Practices](https://www.cloudflare.com/learning/email-security/what-is-email-security/)

---

## ✅ Quick Start Checklist

Backend:
- [ ] Install `nodemailer`: `npm install nodemailer`
- [ ] Configure SMTP in `.env`
- [ ] Set `RECAPTCHA_SECRET_KEY` in `.env`
- [ ] Test email sending

Frontend:
- [ ] Install `react-google-recaptcha`: `npm install react-google-recaptcha @types/react-google-recaptcha`
- [ ] Set `REACT_APP_RECAPTCHA_SITE_KEY` in `.env`
- [ ] Test login flow

Testing:
- [ ] Test regular password login
- [ ] Test OTP login flow
- [ ] Test CAPTCHA verification
- [ ] Test OTP resend functionality
- [ ] Test OTP expiration

---

**Need Help?** Check the troubleshooting section or contact support.
