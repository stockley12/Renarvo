<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        $this->addIndexes('cars', [
            ['city', 'status'],
            ['category', 'status'],
            ['price_per_day'],
        ]);

        $this->addIndexes('reservations', [
            ['status', 'pickup_at'],
            ['company_id', 'created_at'],
            ['customer_id', 'status'],
        ]);

        $this->addIndexes('reviews', [
            ['company_id', 'status'],
        ]);

        $this->addIndexes('audit_logs', [
            ['action', 'created_at'],
            ['target_type', 'target_id'],
            ['actor_id', 'created_at'],
        ]);

        $this->addIndexes('jobs', [
            ['status', 'run_after'],
        ]);

        $this->addIndexes('notifications', [
            ['user_id', 'created_at'],
        ]);
    }

    public function down(): void
    {
        $this->dropIndexes('cars', [
            ['city', 'status'],
            ['category', 'status'],
            ['price_per_day'],
        ]);

        $this->dropIndexes('reservations', [
            ['status', 'pickup_at'],
            ['company_id', 'created_at'],
            ['customer_id', 'status'],
        ]);

        $this->dropIndexes('reviews', [
            ['company_id', 'status'],
        ]);

        $this->dropIndexes('audit_logs', [
            ['action', 'created_at'],
            ['target_type', 'target_id'],
            ['actor_id', 'created_at'],
        ]);

        $this->dropIndexes('jobs', [
            ['status', 'run_after'],
        ]);

        $this->dropIndexes('notifications', [
            ['user_id', 'created_at'],
        ]);
    }

    private function addIndexes(string $table, array $indexes): void
    {
        Schema::table($table, function (Blueprint $blueprint) use ($table, $indexes) {
            foreach ($indexes as $columns) {
                $name = $table . '_' . implode('_', $columns) . '_index';
                if ($this->indexExists($table, $name)) {
                    continue;
                }
                $blueprint->index($columns, $name);
            }
        });
    }

    private function dropIndexes(string $table, array $indexes): void
    {
        Schema::table($table, function (Blueprint $blueprint) use ($table, $indexes) {
            foreach ($indexes as $columns) {
                $name = $table . '_' . implode('_', $columns) . '_index';
                if (! $this->indexExists($table, $name)) {
                    continue;
                }
                $blueprint->dropIndex($name);
            }
        });
    }

    private function indexExists(string $table, string $indexName): bool
    {
        try {
            return Schema::hasIndex($table, $indexName);
        } catch (\Throwable) {
            $driver = Schema::getConnection()->getDriverName();
            if ($driver === 'sqlite') {
                $rows = Schema::getConnection()->select(
                    "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name=? AND name=?",
                    [$table, $indexName]
                );
                return ! empty($rows);
            }
            $rows = Schema::getConnection()->select(
                "SHOW INDEX FROM `{$table}` WHERE Key_name = ?",
                [$indexName]
            );
            return ! empty($rows);
        }
    }
};
