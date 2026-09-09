import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'space_bookings.json');

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
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('Could not read space_bookings.json:', err.message);
  }
  return INITIAL_SPACE_BOOKINGS;
}

export function addSpaceBooking(booking) {
  try {
    const list = getSpaceBookings();
    const updated = [booking, ...list];
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return booking;
  } catch (err) {
    console.warn('Could not write to space_bookings.json:', err.message);
    return booking;
  }
}

export function updateSpaceBookingStatus(id, newStatus) {
  try {
    const list = getSpaceBookings();
    const updated = list.map((item) =>
      item.id === id || item.booking_number === id ? { ...item, status: newStatus } : item
    );
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  } catch (err) {
    console.warn('Could not update space_bookings.json:', err.message);
    return [];
  }
}
