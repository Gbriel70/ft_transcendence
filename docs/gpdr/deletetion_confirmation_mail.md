**by default, no real email is sent**.

- In auth.js, `createMailTransporter()` returns `null` when `SMTP_HOST` is empty.
- In that case, `sendEmail()` just writes the message to auth logs (see auth.js).
- Your example env has `SMTP_HOST=` empty in .env.example, so GDPR deletion confirmation is currently **log-only**, not delivered to inbox.
- The deletion flow itself exists and is triggered at auth.js.

To enable real emails, set SMTP vars in `.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) and restart auth with `docker compose up -d --build auth_service`.
If you want, I can quickly validate your current container logs to show the generated confirmation link after a delete request.
