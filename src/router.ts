export function navigate(path: string): void {
  window.location.hash = path.startsWith('/') ? path : `/${path}`;
}
