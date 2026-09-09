import { getCustomOrders } from '@/lib/custom-orders-store';
import AdminCustomOrdersTable from '@/components/AdminCustomOrdersTable';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Кастомні замовлення — CreaSphere Admin',
};

export default function AdminCustomOrdersPage() {
  const orders = getCustomOrders();

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-header__title">Кастомні замовлення</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Запити клієнтів на індивідуальні вироби під замовлення (дзвінок майстра)
          </p>
        </div>
      </div>

      <AdminCustomOrdersTable initialOrders={orders} />
    </div>
  );
}
