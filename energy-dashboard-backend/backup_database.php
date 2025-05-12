<?php
require_once 'config.php';

function backupDatabase() {
    global $host, $dbname, $username, $password;
    
    $backup_file = 'backup_' . date("Y-m-d_H-i-s") . '.sql';
    
    // Command to create backup
    $command = sprintf(
        'mysqldump --host=%s --user=%s --password=%s %s > %s',
        escapeshellarg($host),
        escapeshellarg($username),
        escapeshellarg($password),
        escapeshellarg($dbname),
        escapeshellarg($backup_file)
    );
    
    // Execute backup
    system($command, $return_var);
    
    if ($return_var === 0) {
        return ['success' => true, 'file' => $backup_file];
    } else {
        return ['success' => false, 'error' => 'Backup failed'];
    }
}

// Execute backup
$result = backupDatabase();
header('Content-Type: application/json');
echo json_encode($result);
?> 