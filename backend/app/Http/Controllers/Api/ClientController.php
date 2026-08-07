<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ClientController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Client::class);

        $clients = Client::query()
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = $request->string('search')->toString();

                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('document', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), function ($query) use ($request): void {
                $query->where('status', $request->string('status')->toString());
            })
            ->latest()
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return ClientResource::collection($clients);
    }

    public function store(StoreClientRequest $request): ClientResource
    {
        $client = Client::create($request->validated());

        return ClientResource::make($client);
    }

    public function show(Client $client): ClientResource
    {
        $this->authorize('view', $client);

        return ClientResource::make($client);
    }

    public function update(UpdateClientRequest $request, Client $client): ClientResource
    {
        $client->update($request->validated());

        return ClientResource::make($client->refresh());
    }

    public function destroy(Client $client): Response
    {
        $this->authorize('delete', $client);

        $client->delete();

        return response()->noContent();
    }
}
