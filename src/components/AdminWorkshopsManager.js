'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminWorkshopsManager() {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');

  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteWorkshop, setConfirmDeleteWorkshop] = useState(null);

  const defaultForm = {
    title: '',
    slug: '',
    description: '',
    duration: '1.5 – 2 години',
    price: '480 ₴',
    difficulty: 'Початковий',
    difficulty_level: 'beginner',
    max_participants: 10,
    available_spots: 10,
    age: 'від 6 років та дорослі',
    image: '/workshop1.jpg',
    badge: '',
    scheduled_dates: '',
  };

  const [form, setForm] = useState(defaultForm);

  const fetchWorkshops = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/workshops');
      const data = await res.json();
      if (res.ok) {
        setWorkshops(Array.isArray(data) ? data : []);
      } else {
        setError(data.error || 'Помилка завантаження майстер-класів');
      }
    } catch (err) {
      setError('Не вдалося з’єднатися з сервером');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const openCreateModal = () => {
    setEditingWorkshop(null);
    setForm(defaultForm);
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (w) => {
    setEditingWorkshop(w);
    setForm({
      title: w.title || '',
      slug: w.slug || '',
      description: w.description || w.desc || '',
      duration: w.duration || '1.5 – 2 години',
      price: w.price || '480 ₴',
      difficulty: w.difficulty || 'Початковий',
      difficulty_level: w.difficulty_level || 'beginner',
      max_participants: w.max_participants || 10,
      available_spots: w.available_spots || 10,
      age: w.age || 'від 6 років та дорослі',
      image: w.image || '/workshop1.jpg',
      badge: w.badge || '',
      scheduled_dates: Array.isArray(w.scheduled_dates) ? w.scheduled_dates.join('\n') : '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setModalError('Вкажіть назву майстер-класу');
      return;
    }

    setSaving(true);
    setModalError('');

    const payload = {
      ...form,
      scheduled_dates: form.scheduled_dates
        ? form.scheduled_dates.split('\n').map((s) => s.trim()).filter(Boolean)
        : [],
    };

    try {
      const url = '/api/workshops';
      const method = editingWorkshop ? 'PUT' : 'POST';
      const body = editingWorkshop ? { ...payload, id: editingWorkshop.id } : payload;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchWorkshops();
        setSuccessMsg(editingWorkshop ? 'Майстер-клас оновлено!' : 'Майстер-клас додано до каталогу!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setModalError(data.error || 'Помилка збереження');
      }
    } catch (err) {
      setModalError('Помилка запиту: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (w) => {
    setDeletingId(w.id);
    try {
      const res = await fetch(`/api/workshops?id=${encodeURIComponent(w.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setWorkshops((prev) => prev.filter((item) => item.id !== w.id));
        setConfirmDeleteWorkshop(null);
        setSuccessMsg(`Майстер-клас «${w.title}» успішно видалено!`);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert(data.error || 'Помилка при видаленні майстер-класу');
      }
    } catch (err) {
      alert('Помилка з’єднання при видаленні майстер-класу');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = workshops.filter((w) =>
    w.title?.toLowerCase().includes(search.toLowerCase()) ||
    w.difficulty?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="admin-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="admin-header__title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🎨</span> Каталог майстер-класів
          </h1>
          <p style={{ color: 'var(--text-muted, #777)', fontSize: 14, marginTop: 4 }}>
            Створення, редагування та видалення творчих занять у каталозі
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={openCreateModal}
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

      {/* Success Banner */}
      {successMsg && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 10,
            background: '#ecfdf5',
            border: '1px solid #10b981',
            color: '#065f46',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)',
          }}
        >
          <span>✓</span> {successMsg}
        </div>
      )}

      {/* Search Filter */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Пошук за назвою або складністю..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Майстер-клас</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Тривалість</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Ціна</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Складність</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Місця</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Дії</th>
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
                            <img
                              src={w.image}
                              alt={w.title}
                              style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }}
                            />
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text, #1f2937)' }}>{w.title}</div>
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
                      <td style={{ padding: '14px 18px', color: '#4b5563' }}>{w.duration || '—'}</td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: 'var(--primary, #283618)' }}>
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
                            onClick={() => openEditModal(w)}
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
                            onClick={() => setConfirmDeleteWorkshop(w)}
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
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#111827' }}>
              Видалити майстер-клас?
            </h3>
            <p style={{ color: '#4b5563', fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
              Ви дійсно бажаєте видалити майстер-клас <strong>«{confirmDeleteWorkshop.title}»</strong> з каталогу сайту?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setConfirmDeleteWorkshop(null)}
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
                onClick={() => handleDelete(confirmDeleteWorkshop)}
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
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
              padding: 28,
              maxWidth: 600,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
              {editingWorkshop ? 'Редагувати майстер-клас' : 'Додати новий майстер-клас'}
            </h3>

            {modalError && (
              <div
                style={{
                  padding: '10px 14px',
                  background: '#fef2f2',
                  color: '#b91c1c',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: 13,
                }}
              >
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Назва заняття *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Тривалість
                  </label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Ціна (наприклад: 500 ₴)
                  </label>
                  <input
                    type="text"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Складність
                  </label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
                  >
                    <option value="Початковий">Початковий</option>
                    <option value="Середній">Середній</option>
                    <option value="Просунутий">Просунутий</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Вік учасників
                  </label>
                  <input
                    type="text"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Всього місць
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.max_participants}
                    onChange={(e) => setForm({ ...form, max_participants: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Доступно місць
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.available_spots}
                    onChange={(e) => setForm({ ...form, available_spots: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Шлях або посилання на фото
                </label>
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Бейдж (наприклад: Хіт сезону, Терапія)
                </label>
                <input
                  type="text"
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Опис заняття
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Розклад занять (кожна дата з нового рядка)
                </label>
                <textarea
                  rows={3}
                  placeholder="12 вер (сб), 14:00&#10;16 вер (ср), 16:30"
                  value={form.scheduled_dates}
                  onChange={(e) => setForm({ ...form, scheduled_dates: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '10px 18px',
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
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--primary, #283618)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {saving ? 'Збереження...' : editingWorkshop ? 'Зберегти зміни' : 'Створити майстер-клас'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
