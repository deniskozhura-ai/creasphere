import fs from 'fs';
import path from 'path';
import os from 'os';

const BUNDLE_FILE = path.join(process.cwd(), 'src', 'data', 'space_bookings.json');
const WRITABLE_FILE = path.join(os.tmpdir(), 'creasphere_space_bookings.json');

const INITIAL_SPACE_BOOKINGS = [];

export function getSpaceBookings() {
  if (globalThis.__creasphere_space_bookings && Array.isArray(globalThis.__creasphere_space_bookings)) {
    return globalThis.__creasphere_space_bookings;
  }

  try {
    if (fs.existsSync(WRITABLE_FILE)) {
      const content = fs.readFileSync(WRITABLE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        globalThis.__creasphere_space_bookings = parsed;
        return parsed;
      }
    }
  } catch (e) {}

  try {
    if (fs.existsSync(BUNDLE_FILE)) {
      const content = fs.readFileSync(BUNDLE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        globalThis.__creasphere_space_bookings = parsed;
        return parsed;
      }
    }
  } catch (err) {}

  globalThis.__creasphere_space_bookings = [...INITIAL_SPACE_BOOKINGS];
  return globalThis.__creasphere_space_bookings;
}

export function addSpaceBooking(booking) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local space bookings store mutation is disabled in production. Use Supabase database.');
  }
  const list = getSpaceBookings();
  const updated = [booking, ...list];
  globalThis.__creasphere_space_bookings = updated;

  try {
    fs.writeFileSync(WRITABLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {}

  try {
    const dir = path.dirname(BUNDLE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(BUNDLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {}

  return booking;
}

export function updateSpaceBookingStatus(id, newStatus) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local space bookings store mutation is disabled in production. Use Supabase database.');
  }
  const list = getSpaceBookings();
  const updated = list.map((item) =>
    item.id === id || item.booking_number === id ? { ...item, status: newStatus } : item
  );
  globalThis.__creasphere_space_bookings = updated;

  try {
    fs.writeFileSync(WRITABLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {}

  try {
    const dir = path.dirname(BUNDLE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(BUNDLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {}

  return updated;
}

export function deleteSpaceBooking(id) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local space bookings store mutation is disabled in production. Use Supabase database.');
  }
  const list = getSpaceBookings();
  const updated = list.filter((item) => item.id !== id && item.booking_number !== id);
  globalThis.__creasphere_space_bookings = updated;

  try {
    fs.writeFileSync(WRITABLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {}

  try {
    const dir = path.dirname(BUNDLE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(BUNDLE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {}

  return true;
}
