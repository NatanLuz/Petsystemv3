const sessionScopedResource = /^\/?(clients|pets|services|appointments|attendances|dashboard)(?:\/|\?|$)/;

export function isSessionScopedApiRequest(url) {
  return typeof url === 'string' && sessionScopedResource.test(url);
}
