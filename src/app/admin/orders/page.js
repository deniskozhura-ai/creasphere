import AdminOrdersTable from '@/components/AdminOrdersTable';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Замовлення — CreaSphere Admin',
};

export default function AdminOrdersPage() {
  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-header__title">Замовлення клієнтів</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Керування замовленнями інтернет-магазину та доставкою
          </p>
        </div>
      </div>

      <AdminOrdersTable />
    </div>
  );
}
