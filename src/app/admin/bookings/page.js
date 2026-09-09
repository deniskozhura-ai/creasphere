import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getDemoBookings } from '@/lib/bookings-store';
import AdminBookingsTable from '@/components/AdminBookingsTable';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Записи на майстер-класи — CreaSphere Admin',
};

export default async function AdminBookingsPage() {
  let bookings = getDemoBookings();

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('workshop_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        bookings = data;
      }
    } catch (e) {
      console.warn('Supabase bookings fetch error:', e.message);
    }
  }

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-header__title">Записи на майстер-класи</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Керування заявками клієнтів на творчі заняття
          </p>
        </div>
      </div>

      <AdminBookingsTable initialBookings={bookings} />
    </div>
  );
}
