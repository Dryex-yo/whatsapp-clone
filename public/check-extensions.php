<?php
// Check PHP extensions available to web server
echo "PHP Version: " . phpversion() . "\n";
echo "SAPI: " . php_sapi_name() . "\n";
echo "\n=== Database Extensions ===\n";
echo "PDO loaded: " . (extension_loaded('pdo') ? 'YES' : 'NO') . "\n";
echo "pdo_pgsql loaded: " . (extension_loaded('pdo_pgsql') ? 'YES' : 'NO') . "\n";
echo "pgsql loaded: " . (extension_loaded('pgsql') ? 'YES' : 'NO') . "\n";
echo "pdo_mysql loaded: " . (extension_loaded('pdo_mysql') ? 'YES' : 'NO') . "\n";

echo "\n=== PDO Drivers ===\n";
$drivers = PDO::getAvailableDrivers();
print_r($drivers);

echo "\n=== php.ini Path ===\n";
echo "php.ini: " . php_ini_loaded_file() . "\n";

echo "\n=== Extension Dir ===\n";
echo "Extension dir: " . ini_get('extension_dir') . "\n";
?>
