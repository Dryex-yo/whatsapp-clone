<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Scheduled Command: Archive Old Message Partitions
 * 
 * Purpose: Drop old message partitions (older than retention period)
 * Schedule: 1st of every month at 03:00 UTC
 * Retention: 2 years (configurable in config/app.php)
 * 
 * This command:
 * 1. Identifies partitions older than retention period
 * 2. Optionally exports to backup before deletion (if configured)
 * 3. Drops the partition to reclaim storage
 * 4. Logs all actions for audit trail
 * 
 * Usage:
 *   php artisan partitions:archive
 *   php artisan partitions:archive --keep-backups  (keep exported SQL files)
 *   php artisan partitions:archive --dry-run        (preview without changes)
 *   
 * Monitoring:
 *   tail -f storage/logs/laravel.log | grep "archive"
 */
class ArchiveMessagePartitionsCommand extends Command
{
    protected $signature = 'partitions:archive {--dry-run} {--keep-backups}';
    protected $description = 'Archive (drop) old message partitions beyond retention period';
    protected $hidden = false;

    public function handle()
    {
        Log::info('Starting message partition archival...');
        
        $dryRun = $this->option('dry-run');
        $keepBackups = $this->option('keep-backups');
        
        if ($dryRun) {
            $this->warn('⚠ DRY RUN MODE - No changes will be made');
        }

        try {
            // Get retention period (default 2 years)
            $retentionMonths = config('app.message_partition_retention_months', 24);
            $archiveDate = Carbon::now()->subMonths($retentionMonths);

            $this->info("Archiving partitions older than {$archiveDate->format('Y-m-d')}");

            // Find old partitions
            $oldPartitions = $this->getOldPartitions($archiveDate);

            if (empty($oldPartitions)) {
                $this->info('✓ No partitions to archive');
                return 0;
            }

            $this->info("Found " . count($oldPartitions) . " partition(s) to archive:");

            $partitionsArchived = 0;

            foreach ($oldPartitions as $partition) {
                $partitionName = $partition->table_name;
                $this->line("  - {$partitionName}");

                if (!$dryRun) {
                    if ($this->archivePartition($partitionName, $keepBackups)) {
                        $partitionsArchived++;
                    }
                }
            }

            if ($dryRun) {
                $this->info('DRY RUN: Would archive ' . count($oldPartitions) . ' partition(s)');
            } else {
                Log::info("Successfully archived {$partitionsArchived} message partitions");
                $this->info("✓ Successfully archived {$partitionsArchived} partition(s)");
            }

            return 0;

        } catch (\Exception $e) {
            Log::error('Partition archival failed: ' . $e->getMessage());
            $this->error('✗ Partition archival failed: ' . $e->getMessage());
            return 1;
        }
    }

    /**
     * Find all partitions older than the given date
     * 
     * @param Carbon $beforeDate
     * @return array Array of partition information
     */
    private function getOldPartitions(Carbon $beforeDate): array
    {
        $cutoffYearMonth = $beforeDate->format('Y_m');

        // Query partition names to find old ones
        $partitions = DB::select("
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name LIKE 'messages_y%_m%'
            AND table_name < 'messages_{$cutoffYearMonth}'
            ORDER BY table_name ASC
        ");

        return $partitions ?? [];
    }

    /**
     * Archive a single partition
     * 
     * Steps:
     * 1. Check partition size
     * 2. Optionally export to SQL backup
     * 3. Drop the partition
     * 4. Log the action
     * 
     * @param string $partitionName
     * @param bool $keepBackup Whether to keep exported SQL file
     * @return bool True if successfully archived
     */
    private function archivePartition(string $partitionName, bool $keepBackup): bool
    {
        try {
            // Get partition size before deletion
            $sizeResult = DB::selectOne(
                "SELECT pg_size_pretty(pg_total_relation_size(?)) as size",
                [$partitionName]
            );
            
            $partitionSize = $sizeResult?->size ?? 'unknown';

            // Optional: Export partition to SQL backup
            if ($keepBackup) {
                $this->exportPartitionBackup($partitionName);
            }

            // Drop the partition (rows in partition are also deleted)
            DB::statement("DROP TABLE IF EXISTS {$partitionName}");

            Log::info("Archived partition {$partitionName} ({$partitionSize})");
            $this->line("    ✓ Archived {$partitionName} ({$partitionSize})");

            return true;

        } catch (\Exception $e) {
            Log::warning("Failed to archive partition {$partitionName}: " . $e->getMessage());
            $this->error("    ✗ Failed to archive {$partitionName}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Export partition data to SQL file before deletion
     * 
     * Uses pg_dump to create a backup file that can be restored if needed.
     * Stored in storage/backups/partition-archives/
     * 
     * @param string $partitionName
     */
    private function exportPartitionBackup(string $partitionName): void
    {
        try {
            $backupDir = storage_path('backups/partition-archives');
            
            // Create backup directory if it doesn't exist
            if (!is_dir($backupDir)) {
                mkdir($backupDir, 0755, true);
            }

            $timestamp = Carbon::now()->format('Y-m-d_H-i-s');
            $backupFile = "{$backupDir}/{$partitionName}_{$timestamp}.sql";

            // Get database connection details
            $dbConfig = config('database.connections.pgsql');
            $host = $dbConfig['host'];
            $port = $dbConfig['port'];
            $database = $dbConfig['database'];
            $user = $dbConfig['username'];

            // Export using pg_dump
            $command = sprintf(
                'PGPASSWORD=%s pg_dump -h %s -p %s -U %s -d %s -t %s > %s',
                escapeshellarg($dbConfig['password']),
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($user),
                escapeshellarg($database),
                escapeshellarg($partitionName),
                escapeshellarg($backupFile)
            );

            exec($command, $output, $returnCode);

            if ($returnCode === 0) {
                $fileSize = filesize($backupFile);
                Log::info("Exported partition backup: {$backupFile} (" . 
                    number_format($fileSize / 1024 / 1024, 2) . " MB)");
            } else {
                Log::warning("Failed to export partition backup for {$partitionName}");
            }

        } catch (\Exception $e) {
            Log::warning("Error exporting partition backup: " . $e->getMessage());
        }
    }
}
