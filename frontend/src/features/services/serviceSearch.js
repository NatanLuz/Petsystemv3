export function filterServices(services, searchTerm) {
  const search = String(searchTerm ?? "").trim().toLowerCase();
  if (!search) return services;

  return services.filter((service) =>
    [service.name, service.description].some((value) =>
      String(value ?? "").toLowerCase().includes(search),
    ),
  );
}
