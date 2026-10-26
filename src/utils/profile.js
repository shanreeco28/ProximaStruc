import { dayNumber, today } from './siteData.js';

// Job title is descriptive; systemRole and other access fields are never editable here.
export function personalProfileUpdates(values) {
  const name = String(values.name || '').trim();
  const role = String(values.role || '').trim();
  const phone = String(values.phone || '').trim();
  const birthday = String(values.birthday || '');
  if (!name || name.length > 120) throw new Error('Enter your name using up to 120 characters.');
  if (role.length > 120) throw new Error('Job title must be 120 characters or fewer.');
  if (phone && !/^[+\d\s().-]{5,40}$/.test(phone)) throw new Error('Enter a valid contact phone number.');
  if (birthday && (dayNumber(birthday) === null || birthday > today())) throw new Error('Enter a valid birthday on or before today.');
  return { name, role, phone, birthday };
}
