<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Monitoring Command: Message Partition Health Check
 * 
 * Purpose: Monitor partition sizes, row counts, and identify issues
 * Schedule: Daily at 01:00 UTC (or manually as needed)
 * 
 * Capabilities:
 * - Monitor partition sizes
 * - Track row count growth
 * - Identify missing or problematic partitions
 * - Alert on anomalies (too large, too small, gaps)
 * - Export metrics for monitoring systems (Prometheus, Datadog, etc.)
 * 
 * Usage:
 *   php artisan partitions:monitor                    (display all partitions)
 *   php artisan partitions:monitor --format=json      (JSON output for APIs)
 *   php artisan partitions:monitor --alert-threshold=100  (alert if partition > 100GB)
 */
class MonitorMessagePartitionsCommand extends Command
{
    protected $signature = 'partitions:monitor {--format=table} {--alert-threshold=100} {--export-metrics}';
    protected $description = 'Monitor message partition health and sizes';
    protected $hidden = false;

    public function handle()
    {
        try {
            $partitions = $this->getPartitionMetrics();
            $format = $this->option('format');
            $alertThreshold = (int)$this->option('alert-threshold');

            if ($format === 'json') {
                $this->outputJson($partitions);
            } else {
                $this->outputTable($partitions, $alertThreshold);
                $this->checkAnomalies($partitions, $alertThreshold);
            }

            if ($this->option('export-metrics')) {
                $this->exportPrometheusMetrics($partitions);
            }

            return 0;

        } catch (\Exception $e) {
            Log::error('Partition monitoring failed: ' . $e->getMessage());
            $this->error('✗ Monitoring failed: ' . $e->getMessage());
            return 1;
        }
    }

    /**
     * Retrieve partition metrics from PostgreSQL
     */
    private function getPartitionMetrics(): array
    {
        $metrics = DB::select("
            SELECT 
                table_name as partition_name,
                EXTRACT(YEAR FROM to_timestamp(
                    SUBSTR(table_name FROM 10 FOR 4)::INTEGER, 
                    'YYYY'
                ))::INTEGER as year,
                EXTRACT(MONTH FROM to_timestamp(
                    SUBSTR(table_name FROM 16 FOR 2)::INTEGER, 
                    'MM'
                ))::INTEGER as month,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||table_name))::TEXT as size,
                pg_total_relation_size(schemaname||'.'||table_name) as size_bytes,
                (SELECT COUNT(*) FROM messages WHERE messages.tableoid = pg_class.oid) as row_count,
                pg_size_pretty(pg_indexes_size(schemaname||'.'||table_name))::TEXT as index_size,
                pg_indexes_size(schemaname||'.'||table_name) as index_size_bytes
            FROM information_schema.tables t
            JOIN pg_class ON pg_class.relname = t.table_name
            WHERE table_schema = 'public'
            AND table_name LIKE 'messages_y%_m%'
            ORDER BY year DESC, month DESC
        ");

        return array_map(function ($row) {
            return (array)$row;
        }, $metrics);
    }

    /**
     * Output metrics in table format
     */
    private function outputTable(array $partitions, int $alertThreshold): void
    {
        $rows = array_map(function ($p) use ($alertThreshold) {
            $status = '✓';
            $sizeGB = ($p['size_bytes'] ?? 0) / 1024 / 1024 / 1024;
            
            if ($sizeGB > $alertThreshold) {
                $status = '⚠';
            }
            
            return [
                $status,
                $p['partition_name'] ?? 'unknown',
                $p['size'] ?? '0 bytes',
                $p['row_count'] ?? 0,
                $p['index_size'] ?? '0 bytes',
            ];
        }, $partitions);

        $this->table(
            ['Status', 'Partition', 'Size', 'Rows', 'Index Size'],
            $rows
        );

        // Summary
        $totalSize = array_sum(array_column($partitions, 'size_bytes'));
        $totalRows = array_sum(array_column($partitions, 'row_count'));
        
        $this->line('');
        $this->info('Summary:');
        $this->line('  Total partitions: ' . count($partitions));
        $this->line('  Total size: ' . $this->formatBytes($totalSize));
        $this->line('  Total rows: ' . number_format($totalRows));
    }

    /**
     * Check for anomalies in partition metrics
     */
    private function checkAnomalies(array $partitions, int $alertThreshold): void
    {
        if (empty($partitions)) {
            return;
        }

        $issues = [];

        // Check for oversized partitions
        foreach ($partitions as $p) {
            $sizeGB = ($p['size_bytes'] ?? 0) / 1024 / 1024 / 1024;
            
            if ($sizeGB > $alertThreshold) {
                $issues[] = "⚠ {$p['partition_name']}: Size {$sizeGB}GB exceeds threshold {$alertThreshold}GB";
            }
        }

        // Check for missing partitions (date gaps)
        if (count($partitions) > 1) {
            $sorted = array_reverse($partitions);
            
            for ($i = 0; $i < count($sorted) - 1; $i++) {
                $current = $sorted[$i];
                $next = $sorted[$i + 1];
                
                // Calculate expected month difference
                $currentDate = \Carbon\Carbon::createFromDate($current['year'], $current['month']);
                $nextDate = \Carbon\Carbon::createFromDate($next['year'], $next['month']);
                $monthDiff = $currentDate->diffInMonths($nextDate);
                
                if ($monthDiff > 1) {
                    $issues[] = "⚠ Gap detected between {$next['partition_name']} and {$current['partition_name']}";
                }
            }
        }

        if (!empty($issues)) {
            $this->warn("\nAnomalies detected:");
            foreach ($issues as $issue) {
                $this->line("  {$issue}");
                Log::warning($issue);
            }
        } else {
            $this->line("\n✓ No anomalies detected");
        }
    }

    /**
     * Output metrics in JSON format (for APIs and monitoring systems)
     */
    private function outputJson(array $partitions): void
    {
        $output = [
            'timestamp' => now()->toIso8601String(),
            'total_partitions' => count($partitions),
            'total_size_bytes' => array_sum(array_column($partitions, 'size_bytes')),
            'total_rows' => array_sum(array_column($partitions, 'row_count')),
            'partitions' => $partitions,
        ];

        $this->line(json_encode($output, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    /**
     * Export metrics in Prometheus format
     * 
     * Can be scraped by Prometheus every minute:
     *   - job_name: 'message-partitions'
     *     scrape_interval: 5m
     *     static_configs:
     *       - targets: ['localhost:8000']
     *     metrics_path: '/api/partitions/metrics'
     */
    private function exportPrometheusMetrics(array $partitions): void
    {
        $metricsFile = storage_path('metrics/message_partitions.prom');
        
        if (!is_dir(dirname($metricsFile))) {
            mkdir(dirname($metricsFile), 0755, true);
        }

        $metrics = "# HELP message_partition_size_bytes Total size of message partition in bytes\n";
        $metrics .= "# TYPE message_partition_size_bytes gauge\n";

        foreach ($partitions as $p) {
            $labels = sprintf(
                'partition="%s",year="%s",month="%s"',
                $p['partition_name'],
                $p['year'],
                $p['month']
            );
            $metrics .= "message_partition_size_bytes{" . $labels . "} " . 
                        ($p['size_bytes'] ?? 0) . "\n";
        }

        $metrics .= "\n# HELP message_partition_row_count Number of rows in partition\n";
        $metrics .= "# TYPE message_partition_row_count gauge\n";

        foreach ($partitions as $p) {
            $labels = sprintf(
                'partition="%s",year="%s",month="%s"',
                $p['partition_name'],
                $p['year'],
                $p['month']
            );
            $metrics .= "message_partition_row_count{" . $labels . "} " . 
                        ($p['row_count'] ?? 0) . "\n";
        }

        file_put_contents($metricsFile, $metrics);
        Log::info("Exported metrics to {$metricsFile}");
    }

    /**
     * Format bytes to human-readable format
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $size = $bytes;
        $unit = 0;

        while ($size >= 1024 && $unit < count($units) - 1) {
            $size /= 1024;
            $unit++;
        }

        return round($size, 2) . ' ' . $units[$unit];
    }
}
