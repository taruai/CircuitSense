<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: http://localhost:3000');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept');
    header('Access-Control-Max-Age: 86400'); // 24 hours
    exit(0);
}

// Set CORS headers for actual request
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json');

require_once 'config.php';

try {
    // Get user ID from query parameter
    $userId = $_GET['user_id'] ?? null;
    if (!$userId) {
        throw new Exception('User ID is required');
    }

    // Get user's kWh rate
    $stmt = $pdo->prepare('SELECT kwh_rate FROM user_settings WHERE user_id = ?');
    $stmt->execute([$userId]);
    $settings = $stmt->fetch();
    $kwhRate = $settings ? $settings['kwh_rate'] : 0.12; // Default rate if not set

    // Get the last 7 days of data for calculations
    $stmt = $pdo->prepare("
        SELECT 
            DATE(timestamp) as date,
            SUM(power) as total_power,
            AVG(power) as avg_power
        FROM power_consumption 
        WHERE user_id = ? 
        AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(timestamp)
        ORDER BY date
    ");
    $stmt->execute([$userId]);
    $dailyData = $stmt->fetchAll();

    if (empty($dailyData)) {
        throw new Exception('No power consumption data found');
    }

    // Calculate daily averages
    $totalKwh = 0;
    $dailyKwh = [];
    foreach ($dailyData as $day) {
        // Convert watts to kilowatts and calculate for 24 hours
        $kwh = ($day['total_power'] / 1000) * 24;
        $dailyKwh[] = [
            'date' => $day['date'],
            'kwh' => $kwh,
            'cost' => $kwh * $kwhRate
        ];
        $totalKwh += $kwh;
    }

    // Calculate averages and projections
    $avgDailyKwh = $totalKwh / count($dailyData);
    $avgDailyCost = $avgDailyKwh * $kwhRate;

    // Projections
    $currentMonth = date('n');
    $daysInMonth = date('t');
    $daysRemaining = $daysInMonth - date('j');

    $projectedMonthlyKwh = $avgDailyKwh * $daysInMonth;
    $projectedMonthlyCost = $projectedMonthlyKwh * $kwhRate;

    $projectedYearlyKwh = $avgDailyKwh * 365;
    $projectedYearlyCost = $projectedYearlyKwh * $kwhRate;

    // Calculate remaining month projection
    $remainingMonthKwh = $avgDailyKwh * $daysRemaining;
    $remainingMonthCost = $remainingMonthKwh * $kwhRate;

    echo json_encode([
        'status' => 'success',
        'data' => [
            'daily_consumption' => $dailyKwh,
            'current_month' => [
                'projected_kwh' => $projectedMonthlyKwh,
                'projected_cost' => $projectedMonthlyCost,
                'remaining_kwh' => $remainingMonthKwh,
                'remaining_cost' => $remainingMonthCost
            ],
            'yearly' => [
                'projected_kwh' => $projectedYearlyKwh,
                'projected_cost' => $projectedYearlyCost
            ],
            'averages' => [
                'daily_kwh' => $avgDailyKwh,
                'daily_cost' => $avgDailyCost
            ],
            'kwh_rate' => $kwhRate
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to calculate projections: ' . $e->getMessage()
    ]);
}
?> 