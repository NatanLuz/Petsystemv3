import assert from "node:assert/strict";
import test from "node:test";
import { filterServices } from "./serviceSearch.js";

const services = [
  { id: 1, name: "Consulta", description: "Avaliação clínica" },
  { id: 2, name: "Banho", description: null },
];

test("service search matches name and description without case sensitivity", () => {
  assert.deepEqual(filterServices(services, " CONSULTA ").map(({ id }) => id), [1]);
  assert.deepEqual(filterServices(services, "CLÍNICA").map(({ id }) => id), [1]);
  assert.deepEqual(filterServices(services, "BANHO").map(({ id }) => id), [2]);
});

test("blank service search returns all services and missing descriptions are safe", () => {
  assert.equal(filterServices(services, ""), services);
  assert.deepEqual(filterServices(services, "inexistente"), []);
});
