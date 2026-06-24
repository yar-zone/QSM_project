<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>كود التحقق</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 24px; }
        .header h1 { color: #0f172a; font-size: 22px; margin: 0; }
        .code { text-align: center; margin: 24px 0; }
        .code span { display: inline-block; background: #f0fdfa; color: #0d9488; font-size: 36px; font-weight: bold; letter-spacing: 8px; padding: 12px 24px; border-radius: 8px; direction: ltr; }
        .text { color: #475569; font-size: 14px; line-height: 1.8; text-align: center; }
        .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>نور القرآن</h1>
        </div>
        <p class="text">مرحباً {{ $userName }}،</p>
        <p class="text">كود التحقق الخاص بك هو:</p>
        <div class="code">
            <span>{{ $code }}</span>
        </div>
        <p class="text">هذا الكود صالح لمدة 10 دقائق. إذا لم تطلب هذا، يمكنك تجاهل هذه الرسالة.</p>
        <div class="footer">
            <p>نور القرآن — منصة إدارة المدارس القرآنية</p>
        </div>
    </div>
</body>
</html>
