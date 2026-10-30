import assert from "node:assert/strict";
import test from "node:test";
import {
  formatAppointmentDate,
  toOperationalInput,
  toOperationalPayload,
} from "./appointmentDateTime.js";

test("local 10:00 remains 10:00 in appointment form payload and display", () => {
  const formValue = "2026-10-13T10:00:00";
  const apiValue = "2026-10-13 10:00:00";

  assert.equal(toOperationalPayload(formValue), apiValue);
  assert.equal(toOperationalInput(apiValue), formValue);
  assert.equal(formatAppointmentDate(apiValue), "13/10/2026 10:00");
});

test("editing legacy serialized appointment preserves its wall-clock time", () => {
  const legacyApiValue = "2026-10-13T10:00:00.000000Z";

  assert.equal(toOperationalInput(legacyApiValue), "2026-10-13T10:00:00");
  assert.equal(toOperationalPayload(toOperationalInput(legacyApiValue)), "2026-10-13 10:00:00");
});
