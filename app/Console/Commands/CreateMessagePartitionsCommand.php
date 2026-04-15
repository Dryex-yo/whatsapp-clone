<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Scheduled Command: Create Message Table Partitions
 * 
 * Purpose: Automatically create new monthly partitions for future months
 * Schedule: 1st of every month at 02:00 UTC
 * 
 * This command pre-creates 12 months of future partitions,
 * ensuring fresh partitions always exist before being needed.
 * 
 * Usage:
 *   php artisan partitions:create
 *   php artisan schedule:work  (development)
 *   
 * Monitoring:
 *   tail -f storage/logs/laravel.log | grep "partition"
 */
class CreateMessagePartitionsCommand extends Command
{
    protected $signature = 'partitions:create';
    protected $description = 'Create future message partitions for 12 months ahead';
    protected $hidden = false;

    public function handle()
    {
        Log::info('Starting message partition creation...');
        
        try {
            $baseDate = Carbon::now();
            $partitionsCreated = 0;

            // Create partitions for next 12 months
            for ($i = 0; $i < 12; $i++) {
                $date = $baseDate->copy()->addMonths($i);
                
                if ($this->createPartition($date)) {
                    $partitionsCreated++;
                }
            }

            Log::info("Successfully created {$partitionsCreated} message partitions");
            $this->info("✓ Created {$partitionsCreated} partitions");

        } catch (\Exception $e) {
            Log::error('Partition creation failed: ' . $e->getMessage());
            $this->error('✗ Partition creation failed: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }

    /**
     * Create a single monthly partition
     * 
     * @param Carbon $date The month to create partition for
     * @return bool True if partition was created, false if already exists
     */
    private function createPartition(Carbon $date): bool
    {
        $year = $date->year;
        $month = str_pad($date->month, 2, '0', STR_PAD_LEFT);
        $partitionName = "messages_y{$year}_m{$month}";

        // Calculate partition boundaries
        $startDate = $date->copy()->startOfMonth();
        $endDate = $date->copy()->addMonth()->startOfMonth();

        // Check if partition already exists
        if ($this->partitionExists($partitionName)) {
            Log::debug("Partition {$partitionName} already exists");
            return false;
        }

        try {
            $startStr = $startDate->format('Y-m-d H:i:s');
            $endStr = $endDate->format('Y-m-d H:i:s');

            DB::statement("
                CREATE TABLE {$partitionName} PARTITION OF messages
                FOR VALUES FROM ('{$startStr}'::timestamp with time zone)
                TO ('{$endStr}'::timestamp with time zone)
            ");

            Log::info("Created partition: {$partitionName} (covers {$startStr} to {$endStr})");
            return true;

        } catch (\Exception $e) {
            Log::warning("Failed to create partition {$partitionName}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if partition exists
     */
    private function partitionExists(string $partitionName): bool
    {
        $result = DB::selectOne(
            "SELECT 1 FROM information_schema.tables WHERE table_name = ?",
            [$partitionName]
        );
        
        return $result !== null;
    }
}
