# Security setup for the React SPA

The browser app now uses Sanctum's session cookie and CSRF flow. It does not store a bearer token in `localStorage`. During local development, keep the Vite proxy enabled and open the frontend at `http://localhost:5173` (do not switch between `localhost` and `127.0.0.1` during a session).

Set these values in `backend/.env` and adapt the allowed origins and stateful domains to the deployment:

```dotenv
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173,localhost,127.0.0.1
SANCTUM_TOKEN_EXPIRATION=720
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
SESSION_LIFETIME=120
SESSION_SECURE_COOKIE=false
SESSION_SAME_SITE=lax
```

For production, use HTTPS, `APP_ENV=production`, `APP_DEBUG=false`, set `SESSION_SECURE_COOKIE=true`, and replace the local CORS origins and Sanctum stateful domains with the real frontend host(s). Keep the frontend and API on the same site when using cookie authentication. Configure a working SMTP mailer: every account receives a six digit email sign-in code. Password recovery also uses mail.

From the `backend` directory, apply the new MFA challenge table and refresh config after changing `.env`:

```powershell
php artisan migrate
php artisan optimize:clear
```

The scheduled task removes expired Sanctum token rows and MFA challenges. For local use, keep this running in a separate terminal:

```powershell
php artisan schedule:work
```

On a production host, run Laravel's `schedule:run` every minute using that host's scheduler. The booking driver arrival endpoints now reject trips without a stored driver assignment; this project does not yet persist booking trip assignments.
