<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$parents = App\Models\User::where('role', 'parent')->with(['parentStudents.user'])->get();
$first = $parents->first();
echo "Keys in parent object:\n";
echo json_encode(array_keys($first->toArray()), JSON_PRETTY_PRINT) . "\n\n";
echo "Full first parent JSON:\n";
echo $first->toJson(JSON_PRETTY_PRINT) . "\n";
