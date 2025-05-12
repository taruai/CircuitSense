<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once 'config.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($data['user_id']) || !isset($data['breaker_id']) || 
    !isset($data['voltage']) || !isset($data['current']) || !isset($data['power'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit();
}

try {
    // Insert power consumption data
    $stmt = $pdo->prepare('
        INSERT INTO power_consumption (user_id, breaker_id, voltage, current, power)
        VALUES (?, ?, ?, ?, ?)
    ');
    
    $stmt->execute([
        $data['user_id'],
        $data['breaker_id'],
        $data['voltage'],
        $data['current'],
        $data['power']
    ]);

    echo json_encode(['message' => 'Power data stored successfully']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to store power data: ' . $e->getMessage()]);
}
?> 