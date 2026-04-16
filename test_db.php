<?php
try {
    $pdo = new PDO(
        'pgsql:host=127.0.0.1;port=5432;dbname=whatsapp_clone',
        'postgres',
        'postgres',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "✓ PostgreSQL Connection Successful!\n";
    $result = $pdo->query("SELECT 1 as test")->fetch();
    echo "✓ Query executed: SELECT 1 returned " . $result['test'] . "\n";
} catch (PDOException $e) {
    echo "✗ Error connecting to PostgreSQL:\n";
    echo "   " . $e->getMessage() . "\n";
    echo "\n✓ Available PDO Drivers: " . implode(", ", PDO::getAvailableDrivers()) . "\n";
}
