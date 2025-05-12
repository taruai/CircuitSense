<?php
require_once 'config_secure.php';

// Check rate limit
checkRateLimit($_SERVER['REMOTE_ADDR']);

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Validate request method
$method = $_SERVER['REQUEST_METHOD'];
if (!in_array($method, ['GET', 'POST', 'PUT', 'DELETE'])) {
    http_response_code(405);
    die(json_encode(['error' => 'Method not allowed']));
}

// Get user ID from session or token
session_start();
$user_id = $_SESSION['user_id'] ?? null;

if (!$user_id) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized']));
}

// Handle different request methods
switch ($method) {
    case 'GET':
        // Get all circuit breakers for user
        $cache_key = "circuit_breakers_user_{$user_id}";
        $cached_data = getCache($cache_key);
        
        if ($cached_data !== false) {
            echo json_encode($cached_data);
            exit();
        }
        
        $stmt = $pdo->prepare("
            SELECT cb.*, pl.max_power, pl.warning_threshold
            FROM circuit_breakers cb
            LEFT JOIN power_limits pl ON cb.id = pl.breaker_id
            WHERE cb.user_id = ?
            ORDER BY cb.name
        ");
        
        $stmt->execute([$user_id]);
        $breakers = $stmt->fetchAll();
        
        setCache($cache_key, $breakers);
        echo json_encode($breakers);
        break;
        
    case 'POST':
        // Create new circuit breaker
        $data = json_decode(file_get_contents('php://input'), true);
        
        $rules = [
            'name' => 'required|min:2',
            'location' => 'required|min:2',
            'power_limit' => 'required|numeric'
        ];
        
        $errors = validateInput($data, $rules);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['errors' => $errors]);
            exit();
        }
        
        try {
            $pdo->beginTransaction();
            
            // Insert circuit breaker
            $stmt = $pdo->prepare("
                INSERT INTO circuit_breakers (user_id, name, location, power_limit)
                VALUES (?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $user_id,
                $data['name'],
                $data['location'],
                $data['power_limit']
            ]);
            
            $breaker_id = $pdo->lastInsertId();
            
            // Insert power limits
            $stmt = $pdo->prepare("
                INSERT INTO power_limits (breaker_id, max_power, warning_threshold)
                VALUES (?, ?, ?)
            ");
            
            $stmt->execute([
                $breaker_id,
                $data['power_limit'],
                $data['power_limit'] * 0.9 // 90% of max power as warning threshold
            ]);
            
            $pdo->commit();
            
            // Clear cache
            $cache_key = "circuit_breakers_user_{$user_id}";
            setCache($cache_key, null, 0);
            
            echo json_encode([
                'success' => true,
                'breaker_id' => $breaker_id
            ]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create circuit breaker']);
        }
        break;
        
    case 'PUT':
        // Update circuit breaker
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Breaker ID is required']);
            exit();
        }
        
        $rules = [
            'name' => 'min:2',
            'location' => 'min:2',
            'power_limit' => 'numeric',
            'status' => 'in:On,Off'
        ];
        
        $errors = validateInput($data, $rules);
        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['errors' => $errors]);
            exit();
        }
        
        try {
            $pdo->beginTransaction();
            
            // Update circuit breaker
            $updates = [];
            $params = [];
            
            if (isset($data['name'])) {
                $updates[] = "name = ?";
                $params[] = $data['name'];
            }
            
            if (isset($data['location'])) {
                $updates[] = "location = ?";
                $params[] = $data['location'];
            }
            
            if (isset($data['power_limit'])) {
                $updates[] = "power_limit = ?";
                $params[] = $data['power_limit'];
            }
            
            if (isset($data['status'])) {
                $updates[] = "status = ?";
                $params[] = $data['status'];
            }
            
            if (!empty($updates)) {
                $params[] = $data['id'];
                $params[] = $user_id;
                
                $stmt = $pdo->prepare("
                    UPDATE circuit_breakers 
                    SET " . implode(", ", $updates) . "
                    WHERE id = ? AND user_id = ?
                ");
                
                $stmt->execute($params);
            }
            
            // Update power limits if power_limit changed
            if (isset($data['power_limit'])) {
                $stmt = $pdo->prepare("
                    UPDATE power_limits 
                    SET max_power = ?, warning_threshold = ?
                    WHERE breaker_id = ?
                ");
                
                $stmt->execute([
                    $data['power_limit'],
                    $data['power_limit'] * 0.9,
                    $data['id']
                ]);
            }
            
            $pdo->commit();
            
            // Clear cache
            $cache_key = "circuit_breakers_user_{$user_id}";
            setCache($cache_key, null, 0);
            
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update circuit breaker']);
        }
        break;
        
    case 'DELETE':
        // Delete circuit breaker
        $breaker_id = $_GET['id'] ?? null;
        
        if (!$breaker_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Breaker ID is required']);
            exit();
        }
        
        try {
            $pdo->beginTransaction();
            
            // Delete circuit breaker (cascade will handle related records)
            $stmt = $pdo->prepare("
                DELETE FROM circuit_breakers 
                WHERE id = ? AND user_id = ?
            ");
            
            $stmt->execute([$breaker_id, $user_id]);
            
            $pdo->commit();
            
            // Clear cache
            $cache_key = "circuit_breakers_user_{$user_id}";
            setCache($cache_key, null, 0);
            
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete circuit breaker']);
        }
        break;
}
?> 