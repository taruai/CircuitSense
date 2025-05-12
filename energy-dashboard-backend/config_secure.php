<?php
// Load environment variables
$env_file = __DIR__ . '/.env';
if (file_exists($env_file)) {
    $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Security headers
header('Access-Control-Allow-Origin: ' . $_ENV['ALLOWED_ORIGIN'] ?? 'http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');

// Rate limiting configuration
define('RATE_LIMIT_WINDOW', 3600); // 1 hour
define('RATE_LIMIT_MAX_REQUESTS', 100);

// Database configuration
$host = $_ENV['DB_HOST'] ?? 'localhost';
$dbname = $_ENV['DB_NAME'] ?? 'energy_dashboard_auth';
$username = $_ENV['DB_USER'] ?? 'root';
$password = $_ENV['DB_PASS'] ?? '';

// Cache configuration
define('CACHE_ENABLED', true);
define('CACHE_DURATION', 300); // 5 minutes

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

// Database connection
try {
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
} catch (PDOException $e) {
    error_log("Database connection failed: " . $e->getMessage());
    die(json_encode(['error' => 'Database connection failed']));
}

// Rate limiting function
function checkRateLimit($ip) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM request_log 
        WHERE ip_address = ? 
        AND timestamp > DATE_SUB(NOW(), INTERVAL ? SECOND)
    ");
    
    $stmt->execute([$ip, RATE_LIMIT_WINDOW]);
    $result = $stmt->fetch();
    
    if ($result['count'] >= RATE_LIMIT_MAX_REQUESTS) {
        http_response_code(429);
        die(json_encode(['error' => 'Rate limit exceeded']));
    }
    
    // Log the request
    $stmt = $pdo->prepare("
        INSERT INTO request_log (ip_address, timestamp) 
        VALUES (?, NOW())
    ");
    $stmt->execute([$ip]);
}

// Cache functions
function getCache($key) {
    global $pdo;
    
    if (!CACHE_ENABLED) return false;
    
    $stmt = $pdo->prepare("
        SELECT cache_value 
        FROM data_cache 
        WHERE cache_key = ? 
        AND expires_at > NOW()
    ");
    
    $stmt->execute([$key]);
    $result = $stmt->fetch();
    
    return $result ? json_decode($result['cache_value'], true) : false;
}

function setCache($key, $value, $duration = CACHE_DURATION) {
    global $pdo;
    
    if (!CACHE_ENABLED) return false;
    
    $stmt = $pdo->prepare("
        INSERT INTO data_cache (cache_key, cache_value, expires_at) 
        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND))
        ON DUPLICATE KEY UPDATE 
        cache_value = VALUES(cache_value),
        expires_at = VALUES(expires_at)
    ");
    
    return $stmt->execute([$key, json_encode($value), $duration]);
}

// Input validation function
function validateInput($data, $rules) {
    $errors = [];
    
    foreach ($rules as $field => $rule) {
        if (!isset($data[$field])) {
            if (strpos($rule, 'required') !== false) {
                $errors[$field] = 'Field is required';
            }
            continue;
        }
        
        $value = $data[$field];
        
        if (strpos($rule, 'email') !== false && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $errors[$field] = 'Invalid email format';
        }
        
        if (strpos($rule, 'numeric') !== false && !is_numeric($value)) {
            $errors[$field] = 'Must be a number';
        }
        
        if (preg_match('/min:(\d+)/', $rule, $matches)) {
            $min = $matches[1];
            if (strlen($value) < $min) {
                $errors[$field] = "Minimum length is $min characters";
            }
        }
    }
    
    return $errors;
}
?> 