<?php
require_once 'config_secure.php';

function migrate() {
    global $pdo;
    
    try {
        $pdo->beginTransaction();
        
        // Create request_log table for rate limiting
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS request_log (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ip_address VARCHAR(45) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_ip_timestamp (ip_address, timestamp)
            )
        ");
        
        // Add indexes to existing tables
        $pdo->exec("
            ALTER TABLE users 
            ADD INDEX IF NOT EXISTS idx_email (email)
        ");
        
        $pdo->exec("
            ALTER TABLE power_consumption 
            ADD INDEX IF NOT EXISTS idx_user_timestamp (user_id, timestamp),
            ADD INDEX IF NOT EXISTS idx_breaker_timestamp (breaker_id, timestamp)
        ");
        
        // Create new tables
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS circuit_breakers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                location VARCHAR(255) NOT NULL,
                power_limit FLOAT NOT NULL,
                status ENUM('On', 'Off') DEFAULT 'Off',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_status (status)
            )
        ");
        
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS alerts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                breaker_id INT NOT NULL,
                type ENUM('overload', 'voltage', 'current') NOT NULL,
                message TEXT NOT NULL,
                severity ENUM('low', 'medium', 'high') NOT NULL,
                status ENUM('active', 'resolved') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (breaker_id) REFERENCES circuit_breakers(id) ON DELETE CASCADE,
                INDEX idx_user_status (user_id, status),
                INDEX idx_breaker_status (breaker_id, status)
            )
        ");
        
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS power_limits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                breaker_id INT NOT NULL,
                max_power FLOAT NOT NULL,
                warning_threshold FLOAT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (breaker_id) REFERENCES circuit_breakers(id) ON DELETE CASCADE,
                INDEX idx_breaker_id (breaker_id)
            )
        ");
        
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS data_cache (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cache_key VARCHAR(255) NOT NULL UNIQUE,
                cache_value TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_cache_key (cache_key),
                INDEX idx_expires_at (expires_at)
            )
        ");
        
        // Update user_settings table
        $pdo->exec("
            ALTER TABLE user_settings 
            ADD COLUMN IF NOT EXISTS refresh_rate INT DEFAULT 30,
            ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'light'
        ");
        
        $pdo->commit();
        return ['success' => true, 'message' => 'Migration completed successfully'];
    } catch (Exception $e) {
        $pdo->rollBack();
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

// Execute migration
$result = migrate();
header('Content-Type: application/json');
echo json_encode($result);
?> 