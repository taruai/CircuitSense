<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

try {
    // Database configuration
    $host = 'localhost';
    $dbname = 'energy_dashboard_auth';
    $username = 'root';
    $password = '';

    // Test connection
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );

    // Test query
    $stmt = $pdo->query('SELECT 1');
    $result = $stmt->fetch();

    echo json_encode([
        'status' => 'success',
        'message' => 'Database connection successful',
        'database' => $dbname,
        'server_info' => $pdo->getAttribute(PDO::ATTR_SERVER_INFO),
        'server_version' => $pdo->getAttribute(PDO::ATTR_SERVER_VERSION)
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed: ' . $e->getMessage(),
        'code' => $e->getCode()
    ]);
}
?> 