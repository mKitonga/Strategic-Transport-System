<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Your Password - Strategic Transport System</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f9fafb;
            color: #111827;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .header {
            background-color: #0f172a;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            letter-spacing: -0.025em;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #1e293b;
        }
        .message {
            margin-bottom: 30px;
            color: #475569;
            font-size: 16px;
        }
        .button-container {
            text-align: center;
            margin: 40px 0;
        }
        .button {
            display: inline-block;
            background-color: #3b82f6;
            color: #ffffff;
            font-weight: 600;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-size: 16px;
            transition: background-color 0.2s;
        }
        .button:hover {
            background-color: #2563eb;
        }
        .footer {
            background-color: #f8fafc;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            margin: 5px 0;
        }
        .link-fallback {
            word-break: break-all;
            color: #3b82f6;
            font-size: 14px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Strategic Transport System</h1>
        </div>
        <div class="content">
            <div class="greeting">Hello {{ $user->name }},</div>
            
            <div class="message">
                <p>We received a request to reset the password for your Strategic Transport System account. If you didn't make this request, you can safely ignore this email.</p>
                <p>To reset your password, click the button below. This link will expire in 60 minutes.</p>
            </div>
            
            <div class="button-container">
                <a href="{{ $resetUrl }}" class="button">Reset My Password</a>
            </div>
            
            <div class="message">
                <p>If the button doesn't work, copy and paste the following link into your browser:</p>
                <p class="link-fallback">{{ $resetUrl }}</p>
            </div>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} Strategic Transport System. All rights reserved.</p>
            <p>If you need help, please contact support.</p>
        </div>
    </div>
</body>
</html>
