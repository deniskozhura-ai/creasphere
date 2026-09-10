import AdminBookingsTable from '@/components/AdminBookingsTable';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Записи на майстер-класи — CreaSphere Admin',
};

export default function AdminBookingsPage() {
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

      <AdminBookingsTable />
    </div>
  );
}
