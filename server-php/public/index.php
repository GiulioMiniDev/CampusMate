<?php

$config = require __DIR__ . '/../config/app.php';
require __DIR__ . '/../lib/response.php';

header('Access-Control-Allow-Origin: ' . $config['allowed_origin']);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

$routes = [
    '/api/health' => __DIR__ . '/../api/health.php',
    '/api/rooms' => __DIR__ . '/../api/rooms.php',
];

if (!array_key_exists($path, $routes)) {
    json_response(404, [
        'error' => 'Endpoint non trovato',
        'path' => $path,
    ]);
    exit;
}

require $routes[$path];

