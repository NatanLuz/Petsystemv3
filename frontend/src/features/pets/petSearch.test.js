import assert from "node:assert/strict";
import test from "node:test";
import { filterPets } from "./petSearch.js";

const pets = [
  { id: 1, name: "Rex", public_code: "123456", species: "Cachorro", breed: "Labrador", client: { name: "Ana Souza" } },
  { id: 2, name: "Mimi", public_code: "654321", species: "Gato", breed: null, client: null },
];

test("pet search matches pet fields, public code, and tutor", () => {
  for (const term of ["REX", "123456", "cachorro", "labrador", "ANA"]) {
    assert.deepEqual(filterPets(pets, term).map(({ id }) => id), [1]);
  }
  assert.deepEqual(filterPets(pets, "654321").map(({ id }) => id), [2]);
});

test("blank pet search returns all pets and missing relationships are safe", () => {
  assert.deepEqual(filterPets(pets, " "), pets);
  assert.deepEqual(filterPets(pets, "not found"), []);
});
