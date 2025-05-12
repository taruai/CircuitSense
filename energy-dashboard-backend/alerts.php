<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once 'config_secure.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get user ID from session or token
session_start();
$user_id = $_SESSION['user_id'] ?? null;

if (!$user_id) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized']));
}

// Simulated alerts data
$simulatedAlerts = [
    [
        'id' => 1,
        'user_id' => $user_id,
        'breaker_id' => 1,
        'type' => 'overload',
        'message' => 'High current detected in Kitchen',
        'severity' => 'high',
        'status' => 'active',
        'created_at' => date('Y-m-d H:i:s', strtotime('-1 hour')),
        'resolved_at' => null
    ],
    [
        'id' => 2,
        'user_id' => $user_id,
        'breaker_id' => 2,
        'type' => 'voltage',
        'message' => 'Voltage fluctuation in Living Room',
        'severity' => 'medium',
        'status' => 'active',
        'created_at' => date('Y-m-d H:i:s', strtotime('-2 hours')),
        'resolved_at' => null
    ]
];

// Handle different request methods
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Return simulated alerts
        echo json_encode($simulatedAlerts);
        break;

    case 'POST':
        // Simulate creating a new alert
        $data = json_decode(file_get_contents('php://input'), true);
        $newAlert = [
            'id' => count($simulatedAlerts) + 1,
            'user_id' => $user_id,
            'breaker_id' => $data['breaker_id'] ?? 1,
            'type' => $data['type'] ?? 'overload',
            'message' => $data['message'] ?? 'New alert',
            'severity' => $data['severity'] ?? 'medium',
            'status' => 'active',
            'created_at' => date('Y-m-d H:i:s'),
            'resolved_at' => null
        ];
        echo json_encode($newAlert);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?> 