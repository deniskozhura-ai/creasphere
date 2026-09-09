import AdminCategoriesManager from '@/components/AdminCategoriesManager';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Управління категоріями — CreaSphere Admin',
};

export default function AdminCategoriesPage() {
  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-header__title">Категорії товарів</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Створення, налаштування та редагування розділів каталогу
          </p>
        </div>
      </div>

      <AdminCategoriesManager />
    </div>
  );
}
