// Visual permissions mirror the backend Gates. The API remains authoritative.
const all = ['admin', 'receptionist', 'veterinarian'];
const operations = ['admin', 'receptionist'];
const admin = ['admin'];

const permissions = {
  'clients.view': all,
  'clients.create': all,
  'clients.update': all,
  'clients.delete': operations,
  'pets.view': all,
  'pets.create': all,
  'pets.update': all,
  'pets.delete': operations,
  'services.view': all,
  'services.create': admin,
  'services.update': admin,
  'services.delete': admin,
  'appointments.view': all,
  'appointments.create': all,
  'appointments.update': all,
  'appointments.delete': admin,
};

export function can(user, capability) {
  return user?.active === true
    && typeof capability === 'string'
    && Object.hasOwn(permissions, capability)
    && permissions[capability].includes(user.role);
}
