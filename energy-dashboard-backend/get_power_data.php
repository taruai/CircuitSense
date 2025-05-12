<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once 'config.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get query parameters
$user_id = $_GET['user_id'] ?? null;
$breaker_id = $_GET['breaker_id'] ?? null;
$start_date = $_GET['start_date'] ?? date('Y-m-d', strtotime('-7 days'));
$end_date = $_GET['end_date'] ?? date('Y-m-d');

if (!$user_id) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID is required']);
    exit();
}

try {
    // Get user's kWh rate
    $stmt = $pdo->prepare('SELECT kwh_rate FROM user_settings WHERE user_id = ?');
    $stmt->execute([$user_id]);
    $settings = $stmt->fetch();
    $kwh_rate = $settings ? $settings['kwh_rate'] : 0.12; // Default rate if not set

    // Build query based on parameters
    $query = '
        SELECT 
            DATE(timestamp) as date,
            breaker_id,
            AVG(voltage) as avg_voltage,
            AVG(current) as avg_current,
            AVG(power) as avg_power,
            SUM(power) as total_power
        FROM power_consumption
        WHERE user_id = ? AND DATE(timestamp) BETWEEN ? AND ?
    ';
    $params = [$user_id, $start_date, $end_date];

    if ($breaker_id) {
        $query .= ' AND breaker_id = ?';
        $params[] = $breaker_id;
    }

    $query .= ' GROUP BY DATE(timestamp), breaker_id ORDER BY date, breaker_id';

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $data = $stmt->fetchAll();

    // If no data found, return empty arrays with default values
    if (empty($data)) {
        echo json_encode([
            'data' => [],
            'summary' => [
                'total_kwh' => 0,
                'total_cost' => 0,
                'avg_daily_kwh' => 0,
                'avg_daily_cost' => 0,
                'projected_monthly_kwh' => 0,
                'projected_monthly_cost' => 0,
                'projected_yearly_kwh' => 0,
                'projected_yearly_cost' => 0,
                'kwh_rate' => $kwh_rate
            ],
            'daily_averages' => []
        ]);
        exit();
    }

    // Calculate kWh and costs
    $total_kwh = 0;
    $total_cost = 0;
    $daily_averages = [];

    foreach ($data as &$row) {
        // Calculate kWh for this period (assuming 1-hour intervals)
        $row['kwh'] = ($row['total_power'] / 1000); // Convert watts to kilowatts
        $total_kwh += $row['kwh'];
        $total_cost += $row['kwh'] * $kwh_rate;
        
        if (!isset($daily_averages[$row['date']])) {
            $daily_averages[$row['date']] = [
                'kwh' => 0,
                'cost' => 0,
                'count' => 0
            ];
        }
        $daily_averages[$row['date']]['kwh'] += $row['kwh'];
        $daily_averages[$row['date']]['cost'] += $row['kwh'] * $kwh_rate;
        $daily_averages[$row['date']]['count']++;
    }

    // Calculate average daily consumption
    $avg_daily_kwh = $total_kwh / count($daily_averages);
    $avg_daily_cost = $total_cost / count($daily_averages);

    // Project monthly and yearly costs
    $projected_monthly_kwh = $avg_daily_kwh * 30;
    $projected_monthly_cost = $projected_monthly_kwh * $kwh_rate;
    $projected_yearly_kwh = $avg_daily_kwh * 365;
    $projected_yearly_cost = $projected_yearly_kwh * $kwh_rate;

    echo json_encode([
        'data' => $data,
        'summary' => [
            'total_kwh' => $total_kwh,
            'total_cost' => $total_cost,
            'avg_daily_kwh' => $avg_daily_kwh,
            'avg_daily_cost' => $avg_daily_cost,
            'projected_monthly_kwh' => $projected_monthly_kwh,
            'projected_monthly_cost' => $projected_monthly_cost,
            'projected_yearly_kwh' => $projected_yearly_kwh,
            'projected_yearly_cost' => $projected_yearly_cost,
            'kwh_rate' => $kwh_rate
        ],
        'daily_averages' => $daily_averages
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch power data: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?> 