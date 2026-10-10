<?php
declare(strict_types=1);

header('Content-Type: text/html; charset=UTF-8');
header('X-Robots-Tag: noindex, nofollow, noarchive', true);
header('Cache-Control: no-store, max-age=0', true);

$appDir = '/home/geelgoco/Chinyadak';
$tokenFile = $appDir . '/tmp/rescue-token';
$rollbackScript = $appDir . '/rollback.sh';
$message = '';
$ok = false;

function h(string $value): string { return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $expected = is_readable($tokenFile) ? trim((string)file_get_contents($tokenFile)) : '';
    $provided = trim((string)($_POST['token'] ?? ''));

    if ($expected === '' || $provided === '' || !hash_equals($expected, $provided)) {
        http_response_code(403);
        $message = 'توکن نجات نامعتبر است.';
    } elseif (!is_file($rollbackScript)) {
        http_response_code(500);
        $message = 'اسکریپت Rollback پیدا نشد.';
    } else {
        $command = '/bin/bash ' . escapeshellarg($rollbackScript) . ' --latest 2>&1';
        $output = [];
        $code = 1;
        exec($command, $output, $code);
        $message = implode("\n", $output);
        $ok = ($code === 0 && str_contains($message, 'ROLLBACK_OK'));
        if (!$ok) http_response_code(500);
    }
}
?>
<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Yadak Store Rescue</title>
<style>
body{font-family:Tahoma,Arial,sans-serif;background:#f3f4f6;margin:0;padding:32px;color:#111827}.box{max-width:720px;margin:auto;background:#fff;border-radius:16px;padding:24px;box-shadow:0 10px 35px #0001}h1{font-size:22px;margin:0 0 8px}.muted{color:#6b7280;line-height:1.9}.warn{background:#fff7ed;border:1px solid #fed7aa;padding:12px;border-radius:10px;margin:16px 0}input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #d1d5db;border-radius:10px;margin:8px 0 12px}button{background:#b91c1c;color:#fff;border:0;border-radius:10px;padding:12px 18px;font-weight:700;cursor:pointer}pre{direction:ltr;text-align:left;white-space:pre-wrap;background:#111827;color:#e5e7eb;padding:14px;border-radius:10px;overflow:auto}.ok{color:#047857}.bad{color:#b91c1c}</style>
</head>
<body>
<div class="box">
<h1>Yadak Store — Emergency Rescue</h1>
<p class="muted">این صفحه مستقل از رابط Node برای بازگردانی آخرین نسخه سالم نگهداری‌شده است.</p>
<div class="warn">Rollback فقط فایل‌های Runtime یعنی <code>server.js</code> و <code>dist</code> را به آخرین نسخه سالم برمی‌گرداند و دیتابیس را دستکاری نمی‌کند.</div>
<form method="post" autocomplete="off">
<label for="token">توکن نجات</label>
<input id="token" name="token" type="password" required autocomplete="off">
<button type="submit">بازگشت به آخرین نسخه سالم</button>
</form>
<?php if ($message !== ''): ?>
<h2 class="<?= $ok ? 'ok' : 'bad' ?>"><?= $ok ? 'Rollback موفق' : 'Rollback ناموفق' ?></h2>
<pre><?= h($message) ?></pre>
<?php endif; ?>
</div>
</body>
</html>
