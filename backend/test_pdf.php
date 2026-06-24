<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    Illuminate\Http\Request::create('/api/login', 'POST', ['email' => 'admin@qsm.com', 'password' => 'password'])
);
$data = json_decode($response->getContent(), true);
$token = $data['data']['token'] ?? null;
echo 'Token: ' . substr($token ?? '', 0, 20) . '...\n';
$request2 = Illuminate\Http\Request::create('/api/certificates/generate-pdf', 'POST', [
    'student_name' => 'test',
    'hizb_count' => 5,
    'grade' => 'good',
    'certificate_type' => 'memorization'
]);
$request2->headers->set('Authorization', 'Bearer ' . $token);
$request2->setUserResolver(function () use ($token) { return null; });
echo 'Request prepared\n';

