'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminProductsManager({ initialProducts }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    try {
      const localCustom = JSON.parse(localStorage.getItem('creasphere_custom_products') || '[]');
      if (Array.isArray(localCustom) && localCustom.length > 0) {
        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const toAdd = localCustom.filter((p) => !existingIds.has(p.id));
          return [...toAdd, ...prev];
        });
      }
    } catch (e) {}
  }, []);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    category_id: '1',
    category_name: 'Подарунки ручної роботи',
    price: '',
    stock: '5',
    status: 'in_stock',
    production_time: 'В наявності',
    material: '',
    dimensions: '',
    description: '',
    image: '/gift_collection.webp',
  });

  const categories = [
    { id: '1', name: 'Подарунки ручної роботи' },
    { id: '2', name: 'Сувеніри та декор' },
    { id: '3', name: 'Творчі набори' },
    { id: '4', name: 'Дитячі іграшки' },
  ];

  const presetImages = [
    { label: 'Подарунковий бокс', url: '/gift_collection.webp' },
    { label: 'Кераміка / Чашка', url: '/gallery1.jpg' },
    { label: 'Свічки / Декор', url: '/gallery3.jpg' },
    { label: 'Іграшка / Ведмедик', url: '/workshop2.jpg' },
    { label: 'Творчий набір', url: '/kids_workshop.webp' },
  ];

  const handleCategoryChange = (e) => {
    const catId = e.target.value;
    const cat = categories.find((c) => c.id === catId);
    setForm((prev) => ({
      ...prev,
      category_id: catId,
      category_name: cat ? cat.name : '',
    }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) return;

    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok && data.product) {
        setProducts((prev) => {
          const updated = [data.product, ...prev];
          try {
            const localCustom = JSON.parse(localStorage.getItem('creasphere_custom_products') || '[]');
            localStorage.setItem('creasphere_custom_products', JSON.stringify([data.product, ...localCustom.filter(p => p.id !== data.product.id)]));
          } catch(err) {}
          return updated;
        });

        setIsModalOpen(false);
        setForm({
          name: '',
          sku: '',
          category_id: '1',
          category_name: 'Подарунки ручної роботи',
          price: '',
          stock: '5',
          status: 'in_stock',
          production_time: 'В наявності',
          material: '',
          dimensions: '',
          description: '',
          image: '/gift_collection.webp',
        });
      } else {
        alert(data.error || 'Помилка при додаванні товару');
      }
    } catch (err) {
      alert('Не вдалося додати товар');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Видалити цей товар з каталогу?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id && p.sku !== id));
        try {
          const localCustom = JSON.parse(localStorage.getItem('creasphere_custom_products') || '[]');
          localStorage.setItem('creasphere_custom_products', JSON.stringify(localCustom.filter((p) => p.id !== id && p.sku !== id)));
        } catch(err) {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.category_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Пошук за назвою, артикулом або категорією..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
            onClick={() => setIsModalOpen(true)}
            className="btn btn--primary"
            style={{ padding: '10px 20px', borderRadius: 12, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span>+ Додати новий товар</span>
          </button>
          <Link href="/shop" target="_blank" className="btn btn--ghost" style={{ padding: '10px 16px', borderRadius: 12, fontSize: 14 }}>
            <span>Каталог на сайті ↗</span>
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
                      <img
                        src={item.images?.[0] || '/gift_collection.webp'}
                        alt={item.name}
                        style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', background: '#f5f5f5' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.brand || 'CreaSphere'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.sku}</td>
                  <td>
                    <span style={{ fontSize: 13, background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 6 }}>
                      {item.category_name}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.price} ₴</td>
                  <td>
                    {item.status === 'pre_order' ? (
                      <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: '#fef3c7', color: '#b45309' }}>
                        ⏳ Під замовлення
                      </span>
                    ) : (
                      <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: '#ecfdf5', color: '#047857' }}>
                        В наявності ({item.stock || 1} шт)
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    <div>{item.material || 'Ручна робота'}</div>
                    <div style={{ color: 'var(--sage, #606c38)' }}>{item.production_time}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link
                        href={`/product/${item.slug || item.id}`}
                        target="_blank"
                        className="btn btn--ghost"
                        style={{ padding: '4px 10px', fontSize: 12, borderRadius: 8 }}
                      >
                        Перегляд
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        style={{
                          padding: '4px 10px',
                          fontSize: 12,
                          borderRadius: 8,
                          background: '#fee2e2',
                          color: '#b91c1c',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Видалити
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                  Товарів не знайдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              maxWidth: 640,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '32px 28px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
                Додати новий товар до магазину
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#777' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProduct} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  Назва товару *
                </label>
                <input
                  type="text"
                  required
                  placeholder="В'язаний ведмедик «Пандик»"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #ccc', fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  Категорія
                </label>
                <select
                  value={form.category_id}
                  onChange={handleCategoryChange}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #ccc', fontSize: 14, background: '#fff' }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  Артикул (SKU)
                </label>
                <input
                  type="text"
                  placeholder="CS-TOY-05"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #ccc', fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  Ціна (₴) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="550"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #ccc', fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  Статус наявності
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value, production_time: e.target.value === 'pre_order' ? '2-4 дні під замовлення' : 'В наявності' })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #ccc', fontSize: 14, background: '#fff' }}
                >
                  <option value="in_stock">В наявності</option>
                  <option value="pre_order">Під замовлення</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  Кількість на складі
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #ccc', fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  Термін виготовлення
                </label>
                <input
                  type="text"
                  placeholder="В наявності або 2-3 дні"
                  value={form.production_time}
                  onChange={(e) => setForm({ ...form, production_time: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #ccc', fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  Матеріали
                </label>
                <input
                  type="text"
                  placeholder="Бавовна, соєвий віск, дерево..."
                  value={form.material}
                  onChange={(e) => setForm({ ...form, material: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #ccc', fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  Розмір / габарити
                </label>
                <input
                  type="text"
                  placeholder="25 см або 350 мл"
                  value={form.dimensions}
                  onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #ccc', fontSize: 14 }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  Зображення товару
                </label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <select
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #ccc', fontSize: 14, background: '#fff' }}
                  >
                    {presetImages.map((img, i) => (
                      <option key={i} value={img.url}>{img.label} ({img.url})</option>
                    ))}
                  </select>
                  <img src={form.image} alt="Прев'ю" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                  Опис товару
                </label>
                <textarea
                  rows={3}
                  placeholder="Опишіть особливості та переваги цього авторського виробу..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #ccc', fontSize: 14 }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: 10 }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn--primary"
                  style={{ width: '100%', padding: '14px', fontSize: 15, borderRadius: 12 }}
                >
                  {loading ? 'Збереження...' : 'Зберегти товар у каталог ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
