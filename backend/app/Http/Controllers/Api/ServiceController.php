<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServiceRequest;
use App\Http\Requests\UpdateServiceRequest;
use App\Models\Service;

class ServiceController extends Controller
{
    public function index()
    {
        return response()->json(Service::withCount(['appointments', 'attendances'])->get());
    }

    public function store(StoreServiceRequest $request)
    {
        $service = Service::create($request->validated());

        return response()->json($service->refresh(), 201);
    }

    public function show(Service $service)
    {
        return response()->json($service);
    }

    public function update(UpdateServiceRequest $request, Service $service)
    {
        $service->update($request->validated());

        return response()->json($service);
    }

    public function destroy(Service $service)
    {
        if ($service->appointments()->exists() || $service->attendances()->exists()) {
            $service->update(['active' => false]);

            return response()->json([
                'message' => 'O serviço possui histórico e foi desativado. Os agendamentos existentes foram preservados.',
                'service' => $service,
            ]);
        }

        $service->delete();

        return response()->noContent();
    }
}
