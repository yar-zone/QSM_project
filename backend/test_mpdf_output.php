<?php
require 'vendor/autoload.php';

$html = '<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>test</title></head><body style="font-family: dejavusans;"><h1>شهادة تقدير</h1><p>الطالب: أحمد علي</p><p>عدد الأحزاب: 5</p><p>التقدير: ممتاز</p></body></html>';

$mpdf = new Mpdf\Mpdf(['mode' => 'utf-8', 'format' => 'A4-L']);
$mpdf->autoArabic = true;
$mpdf->autoScriptToLang = true;
$mpdf->autoLangToFont = true;
$mpdf->WriteHTML($html);
file_put_contents('test_output.pdf', $mpdf->Output('', 'S'));
echo 'PDF saved: ' . filesize('test_output.pdf') . ' bytes';
