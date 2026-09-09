import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getProducts } from '@/lib/products-store';
import { getOrders } from '@/lib/orders-store';
import { getDemoBookings } from '@/lib/bookings-store';
import { getCustomOrders } from '@/lib/custom-orders-store';
import { getSpaceBookings } from '@/lib/space-bookings-store';
import AdminDashboardClient from '@/components/AdminDashboardClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Панель керування — CreaSphere Admin',
};

export default async function AdminDashboardPage() {
  const allProducts = getProducts();
  const allOrders = getOrders();
  const allBookings = getDemoBookings();
  const allCustomOrders = getCustomOrders();
  const allSpaceBookings = getSpaceBookings();

  let productsCount = allProducts.length;
  let ordersCount = allOrders.length;
  let totalRevenue = allOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
  let bookings = allBookings;
  let bookingsCount = allBookings.length;
  let customOrdersCount = allCustomOrders.length;
  let spaceBookingsCount = allSpaceBookings.length;

  let recentOrders = allOrders.slice(0, 5);

  if (isSupabaseConfigured) {
    try {
      const { count: pCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      if (pCount !== null) productsCount = pCount;

      // 1. Total revenue calculated over ALL orders in database (NOT limited to 5!)
      const { data: allOrderAmounts } = await supabase
        .from('orders')
        .select('total_amount');
      if (allOrderAmounts && Array.isArray(allOrderAmounts)) {
        totalRevenue = allOrderAmounts.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
      }

      // 2. Recent orders for UI display only (limited to 5)
      const { data: orders, count: oCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5);

      if (oCount !== null) ordersCount = oCount;
      if (orders && orders.length > 0) {
        recentOrders = orders;
      }

      const { data: dbBookings, count: bCount } = await supabase
        .from('workshop_bookings')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5);

      if (bCount !== null) bookingsCount = bCount;
      if (dbBookings && dbBookings.length > 0) {
        bookings = dbBookings;
      }
    } catch (e) {
      console.warn('Supabase admin stats error:', e.message);
    }
  }

  const initialStats = {
    productsCount,
    ordersCount,
    totalRevenue,
    bookingsCount,
    customOrdersCount,
    spaceBookingsCount,
  };

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-header__title">Панель керування</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Огляд ключових показників магазину, майстер-класів та простору CreaSphere
          </p>
        </div>
      </div>

      <AdminDashboardClient
        initialStats={initialStats}
        initialRecentOrders={recentOrders}
        initialBookings={bookings}
        initialCustomOrders={allCustomOrders}
        initialSpaceBookings={allSpaceBookings}
      />
    </div>
  );
}
