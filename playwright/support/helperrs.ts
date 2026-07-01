export function generateOrderCode() {
  return `VLO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}
