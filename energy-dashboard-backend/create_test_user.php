<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json');

require_once 'config.php';

try {
    // Check if test user already exists
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute(['test@example.com']);
    $existingUser = $stmt->fetch();

    if ($existingUser) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Test user already exists',
            'user_id' => $existingUser['id'],
            'email' => 'test@example.com',
            'password' => 'test123'
        ]);
        exit;
    }

    // Create test user
    $stmt = $pdo->prepare('
        INSERT INTO users (name, email, password, created_at) 
        VALUES (?, ?, ?, NOW())
    ');

    $name = 'Test User';
    $email = 'test@example.com';
    $password = password_hash('test123', PASSWORD_DEFAULT);

    $stmt->execute([$name, $email, $password]);
    $userId = $pdo->lastInsertId();

    // Create user settings
    $stmt = $pdo->prepare('
        INSERT INTO user_settings (user_id, kwh_rate) 
        VALUES (?, ?)
    ');
    $stmt->execute([$userId, 12.00]); // Rate of ₱12.00 per kWh

    echo json_encode([
        'status' => 'success',
        'message' => 'Test user created successfully',
        'user_id' => $userId,
        'email' => $email,
        'password' => 'test123'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to create test user: ' . $e->getMessage()
    ]);
}
?> 