'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function ProductsTable({
  products = [],
  loadingProducts = false,
  search = '',
  onSearchChange,
  onOpenAdd,
  onEdit,
  onDelete,
  deletingId,
  confirmDeleteProduct,
  onConfirmDelete,
  onCancelDelete,
}) {
  const filtered = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.category_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          placeholder="🔍 Пошук за назвою, артикулом або категорією..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: 12,
            border: '1px solid var(--border, #d1d5db)',
            width: 340,
            maxWidth: '100%',
            fontSize: 14,
          }}
        />

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            onClick={onOpenAdd}
            className="btn btn--primary"
            style={{ borderRadius: 12, padding: '10px 20px', fontWeight: 600 }}
          >
            <span>+ Додати новий товар</span>
          </button>
          <Link
            href="/shop"
            target="_blank"
            className="btn btn--secondary"
            style={{ borderRadius: 12, padding: '10px 16px' }}
          >
            <span>Переглянути магазин ↗</span>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Товар</th>
              <th>Артикул</th>
              <th>Категорія</th>
              <th>Ціна</th>
              <th>Наявність</th>
              <th>Матеріал / Час</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Image
                        src={item.images?.[0] || item.image || '/gift_collection.webp'}
                        alt={item.name}
                        width={44}
                        height={44}
                        style={{
                          borderRadius: 8,
                          objectFit: 'cover',
                          background: '#f5f5f5',
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {item.images?.length > 1 && (
                            <span style={{ fontSize: 11, color: 'var(--primary, #606c38)' }}>
                              📷 {item.images.length} фото
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.sku}</td>
                  <td>
                    <span
                      style={{
                        fontSize: 13,
                        background: 'rgba(0,0,0,0.05)',
                        padding: '2px 8px',
                        borderRadius: 6,
                      }}
                    >
                      {item.category_name}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{Number(item.price || 0).toFixed(2)} ₴</td>
                  <td>
                    {item.status === 'pre_order' ? (
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          background: '#fef3c7',
                          color: '#b45309',
                        }}
                      >
                        ⏳ Під замовлення
                      </span>
                    ) : (
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          background: '#ecfdf5',
                          color: '#047857',
                        }}
                      >
                        В наявності ({item.stock || 1} шт)
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    <div>{item.material || 'Ручна робота'}</div>
                    <div style={{ color: 'var(--sage, #606c38)' }}>{item.production_time}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link
                        href={`/product/${item.slug || item.id}`}
                        target="_blank"
                        className="btn btn--ghost"
                        style={{ padding: '4px 8px', fontSize: 12, borderRadius: 8 }}
                      >
                        Перегляд
                      </Link>
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        style={{
                          padding: '4px 8px',
                          fontSize: 12,
                          borderRadius: 8,
                          background: '#e0e7ff',
                          color: '#3730a3',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        ✏️ Редагувати
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        disabled={deletingId === item.id}
                        style={{
                          padding: '4px 8px',
                          fontSize: 12,
                          borderRadius: 8,
                          background: '#fee2e2',
                          color: '#b91c1c',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        {deletingId === item.id ? '...' : 'Видалити'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: 'center',
                    padding: '32px 16px',
                    color: 'var(--text-muted)',
                  }}
                >
                  {loadingProducts ? 'Завантаження каталогу товарів...' : 'Товарів не знайдено'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => !deletingId && onCancelDelete()}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 460,
              padding: 24,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#111827' }}>
              Видалити товар?
            </h3>
            <p style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.5, margin: '0 0 20px' }}>
              Ви дійсно бажаєте видалити товар <strong>«{confirmDeleteProduct.name}»</strong> (
              {confirmDeleteProduct.sku || 'без артикулу'}) з каталогу? Цю дію неможливо скасувати.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={onCancelDelete}
                style={{
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  color: '#374151',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Скасувати
              </button>
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={onConfirmDelete}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#dc2626',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: deletingId ? 'not-allowed' : 'pointer',
                }}
              >
                {deletingId ? 'Видалення...' : 'Так, видалити'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
