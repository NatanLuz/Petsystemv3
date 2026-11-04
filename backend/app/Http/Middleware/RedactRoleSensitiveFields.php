<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class RedactRoleSensitiveFields
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $role = $request->user()?->role;

        if (! $response instanceof JsonResponse || ! in_array($role, [User::ROLE_VETERINARIAN, User::ROLE_RECEPTIONIST], true)) {
            return $response;
        }

        $hidden = $role === User::ROLE_VETERINARIAN
            ? ['amount_charged', 'payment_method', 'price']
            : ['evolution'];

        $response->setData($this->redact($response->getData(true), $hidden));

        return $response;
    }

    private function redact(mixed $value, array $hidden): mixed
    {
        if (! is_array($value)) {
            return $value;
        }

        foreach ($value as $key => $item) {
            if (is_string($key) && in_array($key, $hidden, true)) {
                unset($value[$key]);
                continue;
            }

            $value[$key] = $this->redact($item, $hidden);
        }

        return $value;
    }
}
