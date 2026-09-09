import { getProducts } from '@/lib/products-store';
import AdminProductsManager from '@/components/AdminProductsManager';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Управління товарами — CreaSphere Admin',
};

export default function AdminProductsPage() {
  const products = getProducts();

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-header__title">Каталог товарів</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Всього позицій: {products.length}
          </p>
        </div>
      </div>

      <AdminProductsManager initialProducts={products} />
    </div>
  );
}
