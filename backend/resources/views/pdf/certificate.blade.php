<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta charset="utf-8">
    <title>شهادة تقدير</title>
    <style>
        body {
            font-family: dejavusans;
            margin: 0;
            padding: 0;
            background: #f0f4f8;
        }
        .outer {
            border: 3pt solid #0D9488;
            margin: 10pt;
            padding: 8pt;
            background: white;
        }
        .inner {
            border: 1pt solid #cbd5e1;
            padding: 15pt 20pt;
            background: white;
        }
        .top-bar {
            height: 4pt;
            background: #0D9488;
            margin-bottom: 15pt;
        }
        .bottom-bar {
            height: 4pt;
            background: #0D9488;
            margin-top: 15pt;
        }
        .center {
            text-align: center;
        }
        .school {
            font-size: 22pt;
            font-weight: bold;
            color: #0F172A;
        }
        .sub {
            font-size: 11pt;
            color: #64748b;
        }
        .divider {
            width: 50%;
            height: 1pt;
            background: #0D9488;
            margin: 8pt auto;
        }
        .label {
            font-size: 11pt;
            color: #64748b;
        }
        .badge {
            background: #0D9488;
            color: white;
            padding: 3pt 12pt;
            font-size: 14pt;
            font-weight: bold;
            display: inline-block;
        }
        .body-text {
            font-size: 13pt;
            color: #475569;
            line-height: 2;
        }
        .student {
            font-size: 28pt;
            font-weight: bold;
            color: #0F172A;
            padding: 6pt 0;
        }
        .student-line {
            width: 35%;
            height: 1.5pt;
            background: #0D9488;
            margin: 0 auto;
        }
        .details {
            font-size: 13pt;
            color: #475569;
            line-height: 2.2;
        }
        .details strong {
            color: #0D9488;
        }
        .info-table {
            width: 100%;
            border-top: 1pt solid #e2e8f0;
            padding-top: 10pt;
        }
        .info-table td {
            width: 33%;
            text-align: center;
            font-size: 10pt;
        }
        .info-label {
            color: #94a3b8;
        }
        .info-value {
            font-weight: bold;
            color: #0F172A;
        }
        .verified { color: #0D9488; }
        .pending { color: #f59e0b; }
    </style>
</head>
<body>
    <div class="outer">
        <div class="inner">
            <div class="top-bar"></div>

            <div class="center">
                <div class="school">مدرسة نور القرآن</div>
                <div class="sub">Nur Quranic School</div>
                <div class="divider"></div>

                <div class="label">شهادة تقدير</div>
                <div class="badge">{{ $certificate_type }}</div>

                <div class="body-text">يشهد المعهد بأن</div>
                <div class="student">{{ $student_name }}</div>
                <div class="student-line"></div>
            </div>

            <div class="center details">
                قد أتم بنجاح حفظ <strong>{{ $hizb_count }}</strong> حزباً من القرآن الكريم<br>
                وحصل على تقدير <strong>{{ $grade }}</strong><br>
                في تاريخ <strong>{{ \Carbon\Carbon::parse($issued_date)->format('Y/m/d') }}</strong>
            </div>

            <table class="info-table">
                <tr>
                    <td>
                        <div class="info-label">رقم الشهادة</div>
                        <div class="info-value">{{ $certificate_number }}</div>
                    </td>
                    <td>
                        <div class="info-label">تاريخ الإصدار</div>
                        <div class="info-value">{{ \Carbon\Carbon::parse($issued_date)->format('Y/m/d') }}</div>
                    </td>
                    <td>
                        <div class="info-label">الحالة</div>
                        <div class="info-value {{ $is_verified ? 'verified' : 'pending' }}">
                            {{ $is_verified ? 'موثقة' : 'قيد التحقق' }}
                        </div>
                    </td>
                </tr>
            </table>

            <div class="bottom-bar"></div>
        </div>
    </div>
</body>
</html>
