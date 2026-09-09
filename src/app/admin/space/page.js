import { getSpaceBookings } from '@/lib/space-bookings-store';
import AdminSpaceTable from '@/components/AdminSpaceTable';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Оренда простору — CreaSphere Admin',
};

export default function AdminSpacePage() {
  const bookings = getSpaceBookings();

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-header__title">Оренда простору</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Заявки на оренду арт-залу для дитячих свят, днів народження, майстер-класів та подій
          </p>
        </div>
      </div>

      <AdminSpaceTable initialBookings={bookings} />
    </div>
  );
}
