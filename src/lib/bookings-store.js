import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'workshop_bookings.json');

const INITIAL_BOOKINGS = [
  {
    id: 'wb-1',
    booking_number: 'MK-849202',
    customer_name: 'Марія Коваленко',
    customer_phone: '+380 95 321 6543',
    customer_email: 'mariya.k@gmail.com',
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
    customer_phone: '+380 67 987 6543',
    customer_email: 'boyko.alex@ukr.net',
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
    customer_phone: '+380 50 444 3322',
    customer_email: 'tanya.melnik@gmail.com',
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
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('Could not read workshop_bookings.json:', err.message);
  }
  return INITIAL_BOOKINGS;
}

export function addDemoBooking(booking) {
  try {
    const list = getDemoBookings();
    const updated = [booking, ...list];
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return booking;
  } catch (err) {
    console.warn('Could not write to workshop_bookings.json:', err.message);
    return booking;
  }
}

export function updateDemoBookingStatus(id, newStatus) {
  try {
    const list = getDemoBookings();
    const updated = list.map((b) =>
      b.id === id || b.booking_number === id ? { ...b, status: newStatus } : b
    );
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  } catch (err) {
    console.warn('Could not update workshop_bookings.json:', err.message);
    return [];
  }
}
