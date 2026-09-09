'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const UK_TO_EN = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye', ж: 'zh',
  з: 'z', и: 'y', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'yu', я: 'ya',
  А: 'a', Б: 'b', В: 'v', Г: 'h', Ґ: 'g', Д: 'd', Е: 'e', Є: 'ye', Ж: 'zh',
  З: 'z', И: 'y', І: 'i', Ї: 'yi', Й: 'y', К: 'k', Л: 'l', М: 'm', Н: 'n',
  О: 'o', П: 'p', Р: 'r', С: 's', Т: 't', У: 'u', Ф: 'f', Х: 'kh', Ц: 'ts',
  Ч: 'ch', Ш: 'sh', Щ: 'shch', Ь: '', Ю: 'yu', Я: 'ya',
  ы: 'y', э: 'e', ъ: '', Ы: 'y', Э: 'e', Ъ: '',
};

function generateSlug(text) {
  if (!text) return '';
  const transliterated = text
    .toString()
    .split('')
    .map((char) => (UK_TO_EN[char] !== undefined ? UK_TO_EN[char] : char))
    .join('');

  return transliterated
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminCategoriesManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');

  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const defaultForm = {
    name: '',
    slug: '',
    description: '',
  };

  const [form, setForm] = useState(defaultForm);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/categories');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Не вдалося завантажити список категорій');
      }
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setForm(defaultForm);
    setSlugManuallyEdited(false);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
    });
    setSlugManuallyEdited(true);
    setError(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    if (!editingCategory && !slugManuallyEdited) {
      setForm({
        ...form,
        name: val,
        slug: generateSlug(val),
      });
    } else {
      setForm({
        ...form,
        name: val,
      });
    }
  };

  const handleSlugChange = (e) => {
    setSlugManuallyEdited(true);
    setForm({
      ...form,
      slug: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const isEditing = Boolean(editingCategory);
      const url = '/api/categories';
      const method = isEditing ? 'PUT' : 'POST';
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim() || generateSlug(form.name),
        description: form.description.trim(),
        ...(isEditing ? { id: editingCategory.id } : {}),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Помилка збереження категорії');
      }

      setSuccessMsg(isEditing ? 'Категорію успішно оновлено!' : 'Категорію успішно створено!');
      setTimeout(() => setSuccessMsg(''), 4000);

      setIsModalOpen(false);
      await fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRequestDelete = (category) => {
    setConfirmDeleteCategory(category);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteCategory) return;
    const category = confirmDeleteCategory;
    setDeletingId(category.id);
    setError(null);

    try {
      const res = await fetch(`/api/categories?id=${encodeURIComponent(category.id)}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Помилка видалення категорії');
      }

      setSuccessMsg(`Категорію «${category.name}» успішно видалено!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setConfirmDeleteCategory(null);
      await fetchCategories();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = categories.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.slug?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Alert Banners */}
      {successMsg && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 10,
            background: '#ecfdf5',
            border: '1px solid #10b981',
            color: '#065f46',
            marginBottom: 20,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 10,
            background: '#fef2f2',
            border: '1px solid #ef4444',
            color: '#991b1b',
            marginBottom: 20,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Control bar */}
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
          placeholder="🔍 Пошук за назвою або slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: 12,
            border: '1px solid var(--border, #d1d5db)',
            width: 320,
            maxWidth: '100%',
            fontSize: 14,
          }}
        />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn btn--primary"
            style={{ borderRadius: 12, padding: '10px 20px', fontWeight: 600 }}
          >
            <span>+ Додати категорію</span>
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

      {/* Categories Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Назва</th>
              <th>Slug / URL</th>
              <th>Опис</th>
              <th style={{ textAlign: 'right', minWidth: 150 }}>Дії</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                  Завантаження категорій...
                </td>
              </tr>
            ) : filtered.length > 0 ? (
              filtered.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-dark, #111827)' }}>
                      {cat.name}
                    </div>
                  </td>
                  <td>
                    <code
                      style={{
                        padding: '3px 8px',
                        background: '#f3f4f6',
                        borderRadius: 6,
                        fontSize: 12,
                        color: '#4b5563',
                      }}
                    >
                      {cat.slug}
                    </code>
                  </td>
                  <td style={{ color: 'var(--text-muted, #6b7280)', fontSize: 13, maxWidth: 320 }}>
                    {cat.description || '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cat)}
                        style={{
                          padding: '6px 12px',
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
                        onClick={() => handleRequestDelete(cat)}
                        disabled={deletingId === cat.id}
                        style={{
                          padding: '6px 12px',
                          fontSize: 12,
                          borderRadius: 8,
                          background: '#fee2e2',
                          color: '#b91c1c',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 500,
                          opacity: deletingId === cat.id ? 0.6 : 1,
                        }}
                      >
                        {deletingId === cat.id ? 'Видалення...' : '🗑️ Видалити'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                  Категорій не знайдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) setIsModalOpen(false);
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 540,
              padding: 24,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                {editingCategory ? 'Редагувати категорію' : 'Створити нову категорію'}
              </h3>
              <button
                type="button"
                onClick={() => !saving && setIsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 6,
                    color: '#374151',
                  }}
                >
                  Назва категорії *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Наприклад: Керамічний декор"
                  value={form.name}
                  onChange={handleNameChange}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 6,
                    color: '#374151',
                  }}
                >
                  URL-ідентифікатор (slug) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ceramic-decor"
                  value={form.slug}
                  onChange={handleSlugChange}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                    fontFamily: 'monospace',
                  }}
                />
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                  Використовується в адресному рядку браузера: <code>/shop?category={form.slug || 'slug'}</code>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 6,
                    color: '#374151',
                  }}
                >
                  Опис категорії
                </label>
                <textarea
                  rows={3}
                  placeholder="Короткий опис для каталогу або SEO..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
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
                  type="submit"
                  disabled={saving}
                  className="btn btn--primary"
                  style={{
                    borderRadius: 10,
                    padding: '10px 22px',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {saving ? 'Збереження...' : editingCategory ? 'Оновити категорію' : 'Створити категорію'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteCategory && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1010,
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !deletingId) setConfirmDeleteCategory(null);
          }}
        >
          <div
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
              Видалити категорію?
            </h3>
            <p style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.5, margin: '0 0 20px' }}>
              Ви дійсно бажаєте видалити категорію <strong>«{confirmDeleteCategory.name}»</strong>? Товари цієї категорії залишаться в базі даних, але їх категорію буде скинуто.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => setConfirmDeleteCategory(null)}
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
                onClick={handleConfirmDelete}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#dc2626',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
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
