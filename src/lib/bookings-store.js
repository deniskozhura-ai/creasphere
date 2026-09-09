import fs from 'fs';
import path from 'path';
import os from 'os';

const BUNDLE_FILE = path.join(process.cwd(), 'src', 'data', 'workshop_bookings.json');
const WRITABLE_FILE = path.join(os.tmpdir(), 'creasphere_workshop_bookings.json');

const INITIAL_BOOKINGS = [
  {
    id: 'wb-1',
    booking_number: 'MK-849202',
    customer_name: 'Марія Коваленко',
    customer_phone: '+380 50 000 0004',
    customer_email: 'mariya.demo@example.com',
    workshop_title: 'Гончарство та кераміка',
    participants_count: 2,
    preferred_date: '2026-09-12',
    preferred_time: '14:00',
    notes: 'Хочемо зліпити парні чашки до річниці',
    status: 'new',
    created_at: '2026-09-09 11:20',
  },
  {
    id: 'wb-2',
    booking_number: 'MK-849185',
    customer_name: 'Олександр Бойко',
    customer_phone: '+380 50 000 0005',
    customer_email: 'boyko.demo@example.com',
    workshop_title: 'Дитячі свята та дні народження',
    participants_count: 6,
    preferred_date: '2026-09-15',
    preferred_time: '11:30',
    notes: 'День народження доньки 8 років, майстер-клас з розпису або мозаїки',
    status: 'confirmed',
    created_at: '2026-09-08 16:45',
  },
  {
    id: 'wb-3',
    booking_number: 'MK-849140',
    customer_name: 'Тетяна Мельник',
    customer_phone: '+380 50 000 0006',
    customer_email: 'tanya.demo@example.com',
    workshop_title: 'Ароматичні соєві свічки',
    participants_count: 1,
    preferred_date: '2026-09-10',
    preferred_time: '16:00',
    notes: 'Індивідуальне заняття',
    status: 'completed',
    created_at: '2026-09-07 10:15',
  },
];

export function getDemoBookings() {
  if (globalThis.__creasphere_bookings && Array.isArray(globalThis.__creasphere_bookings)) {
    return globalThis.__creasphere_bookings;
  }

  try {
    if (fs.existsSync(WRITABLE_FILE)) {
      const content = fs.readFileSync(WRITABLE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        globalThis.__creasphere_bookings = parsed;
        return parsed;
      }
    }
  } catch (e) {}

  try {
    if (fs.existsSync(BUNDLE_FILE)) {
      const content = fs.readFileSync(BUNDLE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        globalThis.__creasphere_bookings = parsed;
        return parsed;
      }
    }
  } catch (err) {}

  globalThis.__creasphere_bookings = [...INITIAL_BOOKINGS];
  return globalThis.__creasphere_bookings;
}

export function addDemoBooking(booking) {
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
