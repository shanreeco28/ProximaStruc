export const validateZone = (zone) => {
  if (!zone) return false;
  // Allow alphanumeric, spaces, and hyphens.
  const regex = /^[a-zA-Z0-9\s-]+$/;
  return regex.test(zone.trim());
};

export const generateSlabId = (zone, date) => {
  if (!validateZone(zone)) {
      throw new Error("Invalid zone format");
  }
  const zoneCode = zone.trim().split(/\s+/).map(w => w.charAt(0)).join('').toUpperCase();
  const dateCode = date ? date.replace(/-/g, '').slice(2) : '000000';
  return `${zoneCode}-${dateCode}`;
};
