import AdminProductsManager from '@/components/AdminProductsManager';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Управління товарами — CreaSphere Admin',
};

export default function AdminProductsPage() {
  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-header__title">Каталог товарів</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Створення, налаштування, редагування та видалення товарів
          </p>
        </div>
      </div>

      <AdminProductsManager />
    </div>
  );
}
