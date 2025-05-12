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
    // Get test user ID
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute(['test@example.com']);
    $user = $stmt->fetch();

    if (!$user) {
        throw new Exception('Test user not found. Please create a test user first.');
    }

    $userId = $user['id'];

    // Clear existing data for this user
    $stmt = $pdo->prepare('DELETE FROM power_consumption WHERE user_id = ?');
    $stmt->execute([$userId]);

    // Generate sample data for the last 7 days
    $stmt = $pdo->prepare('
        INSERT INTO power_consumption 
        (user_id, breaker_id, power, voltage, current, timestamp) 
        VALUES (?, ?, ?, ?, ?, ?)
    ');

    $breakerIds = [1, 2, 3, 4, 5, 6, 7]; // All breaker IDs
    
    // Base values for different breakers (in watts) - adjusted for ₱3,000 monthly bill
    $basePowers = [
        1 => 5.0,    // Main Panel (baseline)
        2 => 4.0,    // Main Bedroom (fan, lights)
        3 => 6.0,    // Kitchen (refrigerator, small appliances)
        4 => 3.0,    // Bathroom (lights, water heater)
        5 => 3.0,    // Guest Bedroom (fan, lights)
        6 => 5.0,    // Living Room (TV, fan, lights)
        7 => 2.0     // Garage (lights)
    ];
    
    $baseVoltage = 230.0; // Standard voltage in Philippines

    // Generate data for the last 7 days
    for ($day = 6; $day >= 0; $day--) {
        $date = date('Y-m-d', strtotime("-$day days"));
        
        // Generate data for each hour of the day
        for ($hour = 0; $hour < 24; $hour++) {
            foreach ($breakerIds as $breakerId) {
                // Add some randomness to make the data more realistic
                $powerVariation = mt_rand(-2, 2);
                $voltageVariation = mt_rand(-5, 5);
                
                // Base power for this breaker
                $basePower = $basePowers[$breakerId];

                // Adjust power based on time of day
                $timeFactor = 1.0;
                if ($hour >= 6 && $hour <= 9) { // Morning peak
                    $timeFactor = 1.1;
                } elseif ($hour >= 17 && $hour <= 21) { // Evening peak
                    $timeFactor = 1.2;
                } elseif ($hour >= 23 || $hour <= 5) { // Night time
                    $timeFactor = 0.1;
                }

                // Adjust power based on breaker and time
                $breakerFactor = 1.0;
                switch ($breakerId) {
                    case 1: // Main Panel
                        $breakerFactor = 1.0;
                        break;
                    case 2: // Main Bedroom
                        if ($hour >= 22 || $hour <= 6) {
                            $breakerFactor = 1.1; // Higher at night (fan)
                        } else {
                            $breakerFactor = 0.2; // Lower during day
                        }
                        break;
                    case 3: // Kitchen
                        if (($hour >= 7 && $hour <= 9) || ($hour >= 12 && $hour <= 14) || ($hour >= 18 && $hour <= 20)) {
                            $breakerFactor = 1.3; // Higher during meal times
                        } else {
                            $breakerFactor = 0.3; // Lower other times (just refrigerator)
                        }
                        break;
                    case 4: // Bathroom
                        if (($hour >= 7 && $hour <= 9) || ($hour >= 19 && $hour <= 21)) {
                            $breakerFactor = 1.2; // Higher during morning/evening
                        } else {
                            $breakerFactor = 0.1; // Lower other times
                        }
                        break;
                    case 5: // Guest Bedroom
                        if ($hour >= 22 || $hour <= 6) {
                            $breakerFactor = 1.1; // Higher at night
                        } else {
                            $breakerFactor = 0.1; // Lower during day
                        }
                        break;
                    case 6: // Living Room
                        if ($hour >= 18 && $hour <= 23) {
                            $breakerFactor = 1.2; // Higher in evening
                        } else {
                            $breakerFactor = 0.1; // Lower other times
                        }
                        break;
                    case 7: // Garage
                        if ($hour >= 8 && $hour <= 18) {
                            $breakerFactor = 1.1; // Higher during day
                        } else {
                            $breakerFactor = 0.1; // Lower at night
                        }
                        break;
                }

                $power = ($basePower + $powerVariation) * $timeFactor * $breakerFactor;
                $voltage = $baseVoltage + $voltageVariation;
                $current = ($power / $voltage); // Calculate current based on power and voltage

                $timestamp = date('Y-m-d H:i:s', strtotime("$date $hour:00:00"));
                
                $stmt->execute([
                    $userId,
                    $breakerId,
                    $power,
                    $voltage,
                    $current,
                    $timestamp
                ]);
            }
        }
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Sample data inserted successfully',
        'user_id' => $userId,
        'records_inserted' => 7 * 24 * count($breakerIds), // 7 days * 24 hours * number of breakers
        'date_range' => [
            'start' => date('Y-m-d', strtotime('-6 days')),
            'end' => date('Y-m-d')
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to insert sample data: ' . $e->getMessage()
    ]);
}
?> 