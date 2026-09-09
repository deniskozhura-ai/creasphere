import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getOrders } from '@/lib/orders-store';
import AdminOrdersTable from '@/components/AdminOrdersTable';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Замовлення — CreaSphere Admin',
};

export default async function AdminOrdersPage() {
  let orders = getOrders();

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        orders = data.map((o) => ({
          ...o,
          items: o.order_items || o.items || [],
        }));
      }
    } catch (e) {
      console.warn('Supabase orders fetch error:', e.message);
    }
  }

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

      <AdminOrdersTable initialOrders={orders} />
    </div>
  );
}
