import AdminCustomOrdersTable from '@/components/AdminCustomOrdersTable';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Кастомні вироби — CreaSphere Admin',
};

export default function AdminCustomOrdersPage() {
  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-header__title">Кастомні вироби</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Запити клієнтів на індивідуальні вироби під замовлення (дзвінок майстра)
          </p>
        </div>
      </div>

      <AdminCustomOrdersTable />
    </div>
  );
}
