'use client';

import { useState, useEffect, useRef } from 'react';

// Client-side image compression: converts multi-megabyte user photos to optimized WebP/JPEG data URLs (~80-150KB)
async function compressImageFile(file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch (e) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      img.src = readerEvent.target.result;
    };
    reader.readAsDataURL(file);
  });
}

const WORKSHOP_PRESETS = [
  { name: 'Гончарство', path: '/workshop1.jpg' },
  { name: 'Мозаїка', path: '/workshop2.jpg' },
  { name: 'Свічки', path: '/workshop3.jpg' },
  { name: 'Головний зал', path: '/workshop_main.jpg' },
  { name: 'Зона відпочинку', path: '/about2.jpg' },
];

const DEFAULT_FORM = {
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

export default function WorkshopForm({
  isOpen,
  onClose,
  editingWorkshop,
  onSave,
  saving = false,
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [modalError, setModalError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    if (editingWorkshop) {
      setForm({
        title: editingWorkshop.title || '',
        slug: editingWorkshop.slug || '',
        description: editingWorkshop.description || editingWorkshop.desc || '',
        duration: editingWorkshop.duration || '1.5 – 2 години',
        price: editingWorkshop.price || '480 ₴',
        difficulty: editingWorkshop.difficulty || 'Початковий',
        difficulty_level: editingWorkshop.difficulty_level || 'beginner',
        max_participants: editingWorkshop.max_participants || 10,
        available_spots: editingWorkshop.available_spots || 10,
        age: editingWorkshop.age || 'від 6 років та дорослі',
        image: editingWorkshop.image || '/workshop1.jpg',
        badge: editingWorkshop.badge || '',
        scheduled_dates: Array.isArray(editingWorkshop.scheduled_dates)
          ? editingWorkshop.scheduled_dates.join('\n')
          : '',
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setModalError('');
  }, [isOpen, editingWorkshop]);

  if (!isOpen) return null;

  const processImageFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Будь ласка, оберіть файл зображення (JPG, PNG, WEBP тощо)');
      return;
    }
    setUploadingImage(true);
    try {
      const dataUrl = await compressImageFile(file);
      setForm((prev) => ({ ...prev, image: dataUrl }));
    } catch (err) {
      alert('Помилка обробки фото: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setModalError('Вкажіть назву майстер-класу');
      return;
    }

    setModalError('');

    const payload = {
      ...form,
      scheduled_dates: form.scheduled_dates
        ? form.scheduled_dates
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    };

    const resError = await onSave(payload, Boolean(editingWorkshop));
    if (resError) {
      setModalError(resError);
    }
  };

  return (
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

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
              marginBottom: 14,
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                Тривалість
              </label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                }}
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
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
              marginBottom: 14,
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                Складність
              </label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                }}
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
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
              marginBottom: 14,
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                Всього місць
              </label>
              <input
                type="number"
                min="1"
                value={form.max_participants}
                onChange={(e) => setForm({ ...form, max_participants: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                }}
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
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                }}
              />
            </div>
          </div>

          {/* Workshop Photo Upload & Selection */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Фотографія майстер-класу
            </label>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: isDragging ? '2px dashed var(--primary, #606c38)' : '2px dashed #cbd5e1',
                backgroundColor: isDragging ? 'rgba(96, 108, 56, 0.08)' : '#f8fafc',
                borderRadius: 12,
                padding: '20px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isDragging ? 'var(--primary, #606c38)' : '#64748b'}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div
                style={{ fontWeight: 600, fontSize: 13, color: '#1f2937', marginBottom: 2 }}
              >
                {uploadingImage
                  ? 'Оптимізація та стиснення фото...'
                  : 'Натисніть для вибору або перетягніть своє фото сюди'}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>
                Підтримуються будь-які фото з телефону або ПК (JPG, PNG, WEBP). Автоматичне стиснення!
              </div>
            </div>

            {/* Current Image Preview & Status */}
            {form.image && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 10,
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 8,
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <img
                    src={form.image}
                    alt="Попередній перегляд"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/workshop1.jpg';
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#1e293b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>Активне фото</span>
                    {form.image.startsWith('data:image/') ? (
                      <span
                        style={{
                          fontSize: 10,
                          background: '#dcfce7',
                          color: '#15803d',
                          padding: '1px 6px',
                          borderRadius: 6,
                          fontWeight: 700,
                        }}
                      >
                        Власне фото
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 10,
                          background: '#e0f2fe',
                          color: '#0369a1',
                          padding: '1px 6px',
                          borderRadius: 6,
                        }}
                      >
                        Стандартне фото
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#64748b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: 2,
                    }}
                  >
                    {form.image.startsWith('data:image/')
                      ? 'Завантажено з пристрою'
                      : form.image}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '3px 8px',
                        fontSize: 11,
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: '#334155',
                      }}
                    >
                      Змінити фото
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, image: '/workshop1.jpg' }))}
                      style={{
                        padding: '3px 8px',
                        fontSize: 11,
                        background: '#fee2e2',
                        border: '1px solid #fca5a5',
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: '#991b1b',
                      }}
                    >
                      Скинути до стандартного
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Preset Selector */}
            <div style={{ marginBottom: 10 }}>
              <div
                style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6 }}
              >
                Або виберіть зі стандартних фотографій:
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {WORKSHOP_PRESETS.map((preset, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, image: preset.path }))}
                    style={{
                      padding: '4px 8px',
                      fontSize: 11,
                      borderRadius: 6,
                      border:
                        form.image === preset.path
                          ? '1px solid var(--primary, #606c38)'
                          : '1px solid #e2e8f0',
                      background:
                        form.image === preset.path ? 'rgba(96, 108, 56, 0.1)' : '#fff',
                      color:
                        form.image === preset.path ? 'var(--primary, #606c38)' : '#475569',
                      fontWeight: form.image === preset.path ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Direct URL input fallback */}
            <div>
              <input
                type="text"
                placeholder="Або введіть пряме посилання на фото (https://...)"
                value={form.image.startsWith('data:image/') ? '' : form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 12,
                  color: '#475569',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Бейдж (наприклад: Хіт сезону, Терапія)
            </label>
            <input
              type="text"
              value={form.badge}
              onChange={(e) => setForm({ ...form, badge: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
              }}
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
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
              }}
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
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
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
              {saving
                ? 'Збереження...'
                : editingWorkshop
                ? 'Зберегти зміни'
                : 'Створити майстер-клас'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
