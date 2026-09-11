import fs from 'fs';
import path from 'path';
import os from 'os';

const BUNDLE_FILE = path.join(process.cwd(), 'src', 'data', 'workshop_bookings.json');
const WRITABLE_FILE = path.join(os.tmpdir(), 'creasphere_workshop_bookings.json');

const INITIAL_BOOKINGS = [];

export function getDemoBookings() {
  if (globalThis.__creasphere_bookings && Array.isArray(globalThis.__creasphere_bookings)) {
    return globalThis.__creasphere_bookings;
  }

  try {
    if (fs.existsSync(WRITABLE_FILE)) {
      const content = fs.readFileSync(WRITABLE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        globalThis.__creasphere_bookings = parsed;
        return parsed;
      }
    }
  } catch (e) {}

  try {
    if (fs.existsSync(BUNDLE_FILE)) {
      const content = fs.readFileSync(BUNDLE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        globalThis.__creasphere_bookings = parsed;
        return parsed;
      }
    }
  } catch (err) {}

  globalThis.__creasphere_bookings = [...INITIAL_BOOKINGS];
  return globalThis.__creasphere_bookings;
}

export function addDemoBooking(booking) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local workshop bookings store mutation is disabled in production. Use Supabase database.');
  }
  const list = getDemoBookings();
  const updated = [booking, ...list];
  globalThis.__creasphere_bookings = updated;

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

export function updateDemoBookingStatus(id, newStatus) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local workshop bookings store mutation is disabled in production. Use Supabase database.');
  }
  const list = getDemoBookings();
  const updated = list.map((b) =>
    b.id === id || b.booking_number === id ? { ...b, status: newStatus } : b
  );
  globalThis.__creasphere_bookings = updated;

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

export function deleteDemoBooking(id) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local workshop bookings store mutation is disabled in production. Use Supabase database.');
  }
  const list = getDemoBookings();
  const updated = list.filter((b) => b.id !== id && b.booking_number !== id);
  globalThis.__creasphere_bookings = updated;

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
