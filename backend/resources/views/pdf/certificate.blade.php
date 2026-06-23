<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Certificate of Achievement</title>
    <style>
        @page { margin: 0; }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            margin: 0;
            padding: 0;
            background: #f5f0e8;
        }
        .certificate-wrapper {
            width: 100%;
            height: 100%;
            padding: 40px;
            box-sizing: border-box;
        }
        .certificate-border {
            border: 4px double #007979;
            padding: 30px;
            background: white;
            min-height: 600px;
            position: relative;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #007979;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #007979;
            font-size: 28px;
            margin: 0 0 5px;
        }
        .header h2 {
            color: #2D3A3A;
            font-size: 16px;
            margin: 0;
            font-weight: normal;
        }
        .title {
            text-align: center;
            margin: 30px 0;
        }
        .title h3 {
            font-size: 14px;
            color: #6B7A7A;
            margin: 0 0 10px;
            text-transform: uppercase;
            letter-spacing: 3px;
        }
        .title h4 {
            font-size: 26px;
            color: #2D3A3A;
            margin: 0;
        }
        .student-name {
            text-align: center;
            font-size: 32px;
            color: #007979;
            font-weight: bold;
            margin: 20px 0;
            padding: 15px;
            border-top: 2px solid #007979;
            border-bottom: 2px solid #007979;
        }
        .details {
            text-align: center;
            font-size: 14px;
            color: #2D3A3A;
            line-height: 2;
            margin: 25px 0;
        }
        .details strong {
            color: #007979;
        }
        .footer {
            position: absolute;
            bottom: 30px;
            left: 30px;
            right: 30px;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #6B7A7A;
            border-top: 1px solid #D4C9B8;
            padding-top: 15px;
        }
        .qr-code {
            text-align: center;
            margin: 20px 0;
        }
        .certificate-number {
            font-size: 11px;
            color: #6B7A7A;
            text-align: center;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="certificate-wrapper">
        <div class="certificate-border">
            <div class="header">
                <h1>Nur Quranic School</h1>
                <h2>Certificate of Quran Memorization</h2>
            </div>

            <div class="title">
                <h3>This is to certify that</h3>
            </div>

            <div class="student-name">
                {{ $student_name }}
            </div>

            <div class="details">
                has successfully memorized <strong>{{ $hizb_count }} hizb(s)</strong> of the Holy Quran<br>
                and has been awarded a grade of <strong>{{ $grade ?? 'N/A' }}</strong><br>
                on this day, <strong>{{ \Carbon\Carbon::parse($issued_date)->format('F j, Y') }}</strong>
            </div>

            @if($qr_code)
            <div class="qr-code">
                <img src="{{ $qr_code }}" alt="QR Code" width="80" height="80">
            </div>
            @endif

            <div class="certificate-number">
                Certificate No: {{ $certificate_number }}
            </div>

            <div class="footer">
                <div>
                    <strong>Issued by:</strong> Nur Quranic School<br>
                    <strong>Certificate Type:</strong> {{ ucfirst($certificate_type) }}
                </div>
                <div>
                    <strong>Status:</strong> {{ $is_verified ? 'Verified' : 'Pending Verification' }}
                </div>
            </div>
        </div>
    </div>
</body>
</html>
