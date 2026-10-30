<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Models\Client;

class ClientController extends Controller
{
    public function index()
    {
        $clients = Client::all();

        return response()->json($clients);
    }

    public function store(StoreClientRequest $request)
    {
        $client = Client::create($request->validated());

        return response()->json($client, 201);
    }

    public function show(Client $client)
    {
        $client->load(['pets.appointments.service', 'pets.attendances.services']);
        foreach ($client->pets as $pet) {
            foreach ($pet->attendances as $attendance) {
                if (request()->user()?->role === User::ROLE_VETERINARIAN) {
                    $attendance->makeHidden(['amount_charged', 'payment_method']);
                } elseif (request()->user()?->role === User::ROLE_RECEPTIONIST) {
                    $attendance->makeHidden(['evolution']);
                }
            }
        }

        return response()->json($client);
    }

    public function update(UpdateClientRequest $request, Client $client)
    {
        $client->update($request->validated());

        return response()->json($client);
    }

    public function destroy(Client $client)
    {
        if ($client->pets()->exists()) {
            return response()->json([
                'message' => 'Não é possível excluir um cliente que possui pets cadastrados.',
            ], 409);
        }

        $client->delete();

        return response()->noContent();
    }
}
