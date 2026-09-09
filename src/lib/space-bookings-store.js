import fs from 'fs';
import path from 'path';
import os from 'os';

const BUNDLE_FILE = path.join(process.cwd(), 'src', 'data', 'space_bookings.json');
const WRITABLE_FILE = path.join(os.tmpdir(), 'creasphere_space_bookings.json');

const INITIAL_SPACE_BOOKINGS = [
  {
    id: 'sp-1',
    booking_number: 'SP-720194',
    customer_name: 'Наталія Шевченко',
    customer_phone: '+380 50 234 5678',
    event_type: 'Дитяче свято / День народження',
    event_date: '2026-09-20',
    event_time: '13:00',
    duration_hours: 3,
    guests_count: 12,
    notes: 'День народження сина, потрібні столи для чаювання та проектор для відео',
    status: 'confirmed',
    created_at: '2026-09-08 15:40',
  },
  {
    id: 'sp-2',
    booking_number: 'SP-720150',
    customer_name: 'Олексій Дмитренко',
    customer_phone: '+380 67 456 7890',
    event_type: 'Власний майстер-клас',
    event_date: '2026-09-22',
    event_time: '17:00',
    duration_hours: 2,
    guests_count: 8,
    notes: 'Майстер-клас з живопису кавою',
    status: 'new',
    created_at: '2026-09-09 09:30',
  },
];

export function getSpaceBookings() {
  if (globalThis.__creasphere_space_bookings && Array.isArray(globalThis.__creasphere_space_bookings)) {
    return globalThis.__creasphere_space_bookings;
  }

  try {
    if (fs.existsSync(WRITABLE_FILE)) {
      const content = fs.readFileSync(WRITABLE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        globalThis.__creasphere_space_bookings = parsed;
        return parsed;
      }
    }
  } catch (e) {}

  try {
    if (fs.existsSync(BUNDLE_FILE)) {
      const content = fs.readFileSync(BUNDLE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        globalThis.__creasphere_space_bookings = parsed;
        return parsed;
      }
    }
  } catch (err) {}

  globalThis.__creasphere_space_bookings = [...INITIAL_SPACE_BOOKINGS];
  return globalThis.__creasphere_space_bookings;
}

export function addSpaceBooking(booking) {
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
