export function toOperationalInput(value) {
  const match = String(value ?? "").match(
    /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2}))?/,
  );
  return match ? `${match[1]}T${match[2]}:${match[3] ?? "00"}` : "";
}

export function toOperationalPayload(value) {
  return toOperationalInput(value).replace("T", " ");
}

export function formatAppointmentDate(value) {
  const operational = toOperationalInput(value);
  if (!operational) return "Data indisponível";
  const [date, time] = operational.split("T");
  return `${date.split("-").reverse().join("/")} ${time.slice(0, 5)}`;
}
