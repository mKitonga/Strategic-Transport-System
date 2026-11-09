<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAccountIsActive
{
    public function handle(Request $request, Closure $next)
    {
        abort_unless($request->user() && $request->user()->status === 'active', 403, 'Your account is pending approval or inactive.');

        return $next($request);
    }
}
