export function attendancePayload(form, editing, role) {
  const payload = editing ? {} : form.appointment_id
    ? { appointment_id: Number(form.appointment_id) }
    : { client_id: Number(form.client_id), pet_id: Number(form.pet_id), service_ids: form.service_ids.map(Number) };

  if (role === 'admin' || role === 'veterinarian') {
    Object.assign(payload, { notes: form.notes || null, evolution: form.evolution || null });
    if (editing) {
      payload.service_ids = form.service_ids.map(Number);
      // Reenviar completed causa 422: a API só aceita a transição a partir de in_progress.
      if (form.status !== editing.status) payload.status = form.status;
    }
  }
  if (role === 'admin' || role === 'receptionist') {
    Object.assign(payload, {
      amount_charged: form.amount_charged === '' ? null : Number(form.amount_charged),
      payment_method: form.payment_method || null,
    });
  }
  return payload;
}
