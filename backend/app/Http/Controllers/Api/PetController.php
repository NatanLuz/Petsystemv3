<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePetRequest;
use App\Http\Requests\UpdatePetRequest;
use App\Models\Pet;

class PetController extends Controller
{
    public function index()
    {
        return response()->json(Pet::with('client')->get());
    }

    public function store(StorePetRequest $request)
    {
        $pet = Pet::create($request->validated());

        $pet->load('client');

        return response()->json($pet, 201);
    }

    public function show(Pet $pet)
    {
        $pet->load(['client', 'appointments.service', 'attendances.services']);
        return response()->json($pet, 200);
    }

    public function update(UpdatePetRequest $request, Pet $pet)
    {
        $pet->update($request->validated());

        $pet->load('client');

        return response()->json($pet, 200);
    }

    public function destroy(Pet $pet)
    {
        if ($pet->appointments()->exists() || $pet->attendances()->exists()) {
            return response()->json([
                'message' => 'Não é possível excluir um pet que possui agendamentos ou atendimentos cadastrados.',
            ], 409);
        }

        $pet->delete();

        return response()->noContent();
    }
}
