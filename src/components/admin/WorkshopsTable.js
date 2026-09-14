'use client';

import Image from 'next/image';

export default function WorkshopsTable({
  workshops = [],
  loading = false,
  error = null,
  search = '',
  onSearchChange,
  onOpenCreate,
  onEdit,
  onDelete,
  deletingId,
  confirmDeleteWorkshop,
  onConfirmDelete,
  onCancelDelete,
}) {
  const filtered = workshops.filter(
    (w) =>
      w.title?.toLowerCase().includes(search.toLowerCase()) ||
      w.difficulty?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="admin-header" style={{ marginBottom: 24 }}>
        <div>
          <h1
            className="admin-header__title"
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <span>🎨</span> Каталог майстер-класів
          </h1>
          <p style={{ color: 'var(--text-muted, #777)', fontSize: 14, marginTop: 4 }}>
            Створення, редагування та видалення творчих занять у каталозі
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onOpenCreate}
            className="btn btn--primary"
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 10,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <span>+</span> Додати майстер-клас
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Пошук за назвою або складністю..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            maxWidth: 400,
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid var(--border-color, #e5e7eb)',
            background: '#fff',
            fontSize: 14,
          }}
        />
      </div>

      {/* Content Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#777' }}>
          Завантаження майстер-класів...
        </div>
      ) : error ? (
        <div style={{ padding: 20, background: '#fef2f2', color: '#991b1b', borderRadius: 8 }}>
          {error}
        </div>
      ) : (
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            border: '1px solid var(--border-color, #e5e7eb)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Майстер-клас</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Тривалість</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Ціна</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Складність</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Місця</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>
                    Дії
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#888' }}>
                      Майстер-класів не знайдено
                    </td>
                  </tr>
                ) : (
                  filtered.map((w) => (
                    <tr key={w.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {w.image && (
                            <Image
                              src={w.image}
                              alt={w.title}
                              width={44}
                              height={44}
                              style={{
                                borderRadius: 8,
                                objectFit: 'cover',
                              }}
                            />
                          )}
                          <div>
                            <div
                              style={{ fontWeight: 600, color: 'var(--text, #1f2937)' }}
                            >
                              {w.title}
                            </div>
                            {w.badge && (
                              <span
                                style={{
                                  fontSize: 11,
                                  background: '#fef3c7',
                                  color: '#92400e',
                                  padding: '2px 8px',
                                  borderRadius: 12,
                                  fontWeight: 600,
                                  display: 'inline-block',
                                  marginTop: 2,
                                }}
                              >
                                {w.badge}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#4b5563' }}>
                        {w.duration || '—'}
                      </td>
                      <td
                        style={{
                          padding: '14px 18px',
                          fontWeight: 600,
                          color: 'var(--primary, #283618)',
                        }}
                      >
                        {w.price}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 500,
                            background: '#f3f4f6',
                            color: '#374151',
                          }}
                        >
                          {w.difficulty || 'Початковий'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#4b5563' }}>
                        {w.available_spots} з {w.max_participants}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <button
                            onClick={() => onEdit(w)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              border: '1px solid #d1d5db',
                              background: '#fff',
                              color: '#374151',
                              fontSize: 13,
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                          >
                            Редагувати
                          </button>
                          <button
                            onClick={() => onDelete(w)}
                            disabled={deletingId === w.id}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              border: '1px solid #fecaca',
                              background: '#fef2f2',
                              color: '#b91c1c',
                              fontSize: 13,
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                          >
                            {deletingId === w.id ? '...' : 'Видалити'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteWorkshop && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              maxWidth: 440,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 8,
                color: '#111827',
              }}
            >
              Видалити майстер-клас?
            </h3>
            <p
              style={{
                color: '#4b5563',
                fontSize: 14,
                lineHeight: 1.5,
                marginBottom: 20,
              }}
            >
              Ви дійсно бажаєте видалити майстер-клас{' '}
              <strong>«{confirmDeleteWorkshop.title}»</strong> з каталогу сайту?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={onCancelDelete}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Скасувати
              </button>
              <button
                onClick={onConfirmDelete}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#dc2626',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Видалити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
