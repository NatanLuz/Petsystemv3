<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()
            ->where('email', $request->validated('email'))
            ->first();

        if ($user === null || ! Hash::check($request->validated('password'), $user->password)) {
            return response()->json([
                'message' => 'Credenciais invalidas.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => UserResource::make($user),
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ]);
    }

    public function me(Request $request): UserResource
    {
        return UserResource::make($request->user());
    }

    public function logout(Request $request): Response
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->noContent();
    }
}
