<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class TransportCatalogController extends Controller
{
    public function health(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'message' => 'Laravel backend is connected.',
            'app_name' => config('app.name'),
            'app_url' => config('app.url'),
            'timestamp' => now()->toDateTimeString(),
        ]);
    }

    public function overview(): JsonResponse
    {
        $roles = collect(config('transport.roles'))
            ->map(fn (array $definition, string $key) => [
                'key' => $key,
                'role' => $definition['label'],
                'module' => $definition['module'],
                'theme' => $definition['theme'],
                'fields' => collect($definition['registration_fields'])
                    ->map(fn (string $label, string $fieldKey) => [
                        'key' => $fieldKey,
                        'label' => $label,
                    ])
                    ->values()
                    ->all(),
            ])
            ->values();

        $modules = collect(config('transport.roles'))
            ->groupBy('module')
            ->map(function ($definitions, $moduleName) {
                $first = $definitions->first() ?: [];

                return [
                    'name' => $moduleName,
                    'theme' => $first['theme'] ?? 'urban-flow',
                    'summary' => match ($moduleName) {
                        'Public Transport Module' => 'Handles SACCO administration and driver registration for public transport.',
                        'School Transport Module' => 'Handles school administration, school drivers, and parent registration.',
                        default => 'Unified transport management.',
                    },
                    'roles' => collect($definitions)->map(fn (array $definition) => [
                        'name' => $definition['label'],
                        'responsibilities' => $definition['capabilities'],
                    ])->values()->all(),
                ];
            })
            ->values();

        return response()->json([
            'system' => [
                'name' => 'Strategic Transport System',
                'tagline' => 'Homepage and authentication for the first project phase.',
                'modules' => $modules->pluck('name')->all(),
            ],
            'homepage_links' => config('transport.homepage_links'),
            'registration' => [
                'common_fields' => array_values(config('transport.common_registration_fields')),
                'roles' => $roles,
            ],
            'modules' => $modules,
            'concepts' => config('transport.concepts'),
            'deferred_modules' => config('transport.deferred_modules'),
        ]);
    }
}
