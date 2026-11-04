export function filterClients(clients, searchTerm) {
  const search = String(searchTerm ?? "").trim().toLowerCase();
  if (!search) return clients;

  return clients.filter((client) =>
    [client.name, client.email, client.phone].some((value) =>
      String(value ?? "").toLowerCase().includes(search),
    ),
  );
}
