import assert from "node:assert/strict";
import test from "node:test";
import { filterClients } from "./clientSearch.js";

const clients = [
  { id: 1, name: "Ana Souza", email: "ana@example.com", phone: "11987654321" },
  { id: 2, name: "Bruno Lima", email: null, phone: "21912345678" },
];

test("client search matches name, e-mail, and phone without case sensitivity", () => {
  assert.deepEqual(filterClients(clients, " ANA ").map(({ id }) => id), [1]);
  assert.deepEqual(filterClients(clients, "EXAMPLE.COM").map(({ id }) => id), [1]);
  assert.deepEqual(filterClients(clients, "219123").map(({ id }) => id), [2]);
});

test("blank client search returns all clients and missing optional data is safe", () => {
  assert.equal(filterClients(clients, "   "), clients);
  assert.deepEqual(filterClients([{ id: 3, name: "Caio" }], "caio").map(({ id }) => id), [3]);
  assert.deepEqual(filterClients(clients, "missing"), []);
});
