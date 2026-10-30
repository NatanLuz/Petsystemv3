export function filterPets(pets, searchTerm) {
  const search = String(searchTerm ?? "").trim().toLowerCase();

  return pets.filter((pet) =>
    [pet.name, pet.public_code, pet.species, pet.breed, pet.client?.name]
      .some((value) => String(value ?? "").toLowerCase().includes(search)),
  );
}
