'use client';

import { useState, useEffect, useRef } from 'react';

// Client-side image compression: converts multi-megabyte photos to optimized WebP/JPEG data URLs (~80-150KB)
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

const PRESET_IMAGES = [
  { label: 'Подарунковий бокс', url: '/gift_collection.webp' },
  { label: 'Кераміка / Чашка', url: '/gallery1.jpg' },
  { label: 'Свічки / Декор', url: '/gallery3.jpg' },
  { label: 'Іграшка / Ведмедик', url: '/workshop2.jpg' },
  { label: 'Творчий набір', url: '/kids_workshop.webp' },
  { label: 'Сувенір дерево', url: '/gallery2.jpg' },
];

const DEFAULT_FORM = {
  name: '',
  sku: '',
  category_id: '1',
  category_name: 'Подарунки ручної роботи',
  price: '',
  stock: '5',
  status: 'active',
  production_time: 'В наявності',
  material: '',
  dimensions: '',
  description: '',
  images: ['/gift_collection.webp'],
};

export default function ProductForm({
  isOpen,
  onClose,
  editingProduct,
  categories = [],
  onSave,
  loading = false,
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [modalError, setModalError] = useState('');

  const fileInputRef = useRef(null);
  const modalContentRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    if (editingProduct) {
      const existingImages =
        Array.isArray(editingProduct.images) && editingProduct.images.length > 0
          ? editingProduct.images
          : [editingProduct.image || '/gift_collection.webp'];

      const matchedCat = categories.find(
        (c) => String(c.id) === String(editingProduct.category_id)
      );

      setForm({
        name: editingProduct.name || '',
        sku: editingProduct.sku || '',
        category_id: String(editingProduct.category_id || categories[0]?.id || '1'),
        category_name:
          editingProduct.category_name ||
          matchedCat?.name ||
          categories[0]?.name ||
          'Подарунки ручної роботи',
        price: editingProduct.price !== undefined ? String(editingProduct.price) : '',
        stock: editingProduct.stock !== undefined ? String(editingProduct.stock) : '5',
        status:
          editingProduct.status === 'in_stock' ? 'active' : editingProduct.status || 'active',
        production_time: editingProduct.production_time || 'В наявності',
        material: editingProduct.material || '',
        dimensions: editingProduct.dimensions || '',
        description: editingProduct.description || '',
        images: existingImages,
      });
    } else {
      const firstCat = categories[0];
      setForm({
        ...DEFAULT_FORM,
        category_id: firstCat ? String(firstCat.id) : '1',
        category_name: firstCat ? firstCat.name : 'Подарунки ручної роботи',
        sku: `CS-ART-${Math.floor(1000 + Math.random() * 9000)}`,
        images: ['/gift_collection.webp'],
      });
    }
    setCustomUrlInput('');
    setModalError('');
  }, [isOpen, editingProduct, categories]);

  if (!isOpen) return null;

  const handleCategoryChange = (e) => {
    const catId = e.target.value;
    const cat = categories.find((c) => String(c.id) === String(catId));
    setForm((prev) => ({
      ...prev,
      category_id: catId,
      category_name: cat ? cat.name : prev.category_name,
    }));
  };

  const processFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploadingImages(true);
    try {
      const processed = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const dataUrl = await compressImageFile(file);
        processed.push(dataUrl);
      }

      if (processed.length > 0) {
        setForm((prev) => {
          const current = prev.images.filter((img) => img !== '/gift_collection.webp');
          return {
            ...prev,
            images: [...processed, ...current],
          };
        });
      }
    } catch (err) {
      alert('Не вдалося завантажити фото: ' + err.message);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleFileInputChange = (e) => {
    processFiles(e.target.files);
    e.target.value = '';
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleAddCustomUrl = () => {
    const url = customUrlInput.trim();
    if (!url) return;
    setForm((prev) => {
      const current = prev.images.filter((img) => img !== '/gift_collection.webp');
      return {
        ...prev,
        images: [...current, url],
      };
    });
    setCustomUrlInput('');
  };

  const handleAddPresetImage = (presetUrl) => {
    setForm((prev) => {
      if (prev.images.includes(presetUrl)) return prev;
      const current = prev.images.filter((img) => img !== '/gift_collection.webp');
      return {
        ...prev,
        images: [...current, presetUrl],
      };
    });
  };

  const handleRemoveImage = (indexToRemove) => {
    setForm((prev) => {
      const updated = prev.images.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        images: updated.length > 0 ? updated : ['/gift_collection.webp'],
      };
    });
  };

  const handleSetPrimaryImage = (indexToPrimary) => {
    setForm((prev) => {
      const target = prev.images[indexToPrimary];
      const rest = prev.images.filter((_, idx) => idx !== indexToPrimary);
      return {
        ...prev,
        images: [target, ...rest],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!form.name.trim()) {
      setModalError('Будь ласка, вкажіть назву товару');
      modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setModalError('Будь ласка, вкажіть коректну ціну товару (число більше 0)');
      modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const stockNum = parseInt(form.stock, 10);
    const validStock = isNaN(stockNum) || stockNum < 0 ? 0 : stockNum;

    const payload = {
      ...form,
      name: form.name.trim(),
      price: priceNum,
      stock: validStock,
    };

    const resError = await onSave(payload, editingProduct?.id);
    if (resError) {
      setModalError(resError);
      modalContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
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
      onClick={onClose}
    >
      <div
        ref={modalContentRef}
        style={{
          background: '#fff',
          borderRadius: 20,
          maxWidth: 680,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px 28px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
            {editingProduct
              ? `✏️ Редагування: ${editingProduct.name}`
              : 'Додати новий товар до магазину'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f3f4f6',
              border: 'none',
              borderRadius: '50%',
              width: 34,
              height: 34,
              cursor: 'pointer',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
        >
          {modalError && (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '12px 16px',
                borderRadius: 10,
                background: '#fef2f2',
                border: '1px solid #ef4444',
                color: '#991b1b',
                fontSize: 14,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>⚠️</span>
              <span>{modalError}</span>
            </div>
          )}

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
              Назва товару *
            </label>
            <input
              type="text"
              required
              placeholder="Наприклад: Керамічна ваза «Осінній ліс»"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #ccc',
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
              Категорія каталогу *
            </label>
            <select
              value={form.category_id}
              onChange={handleCategoryChange}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #ccc',
                fontSize: 14,
                background: '#fff',
              }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              {form.category_id &&
                !categories.some((c) => String(c.id) === String(form.category_id)) && (
                  <option value={form.category_id}>
                    {form.category_name || 'Обрана категорія'}
                  </option>
                )}
            </select>
            <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
              Товар з&apos;явиться у цьому розділі магазину
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
              Артикул (SKU)
            </label>
            <input
              type="text"
              placeholder="CS-ART-104"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #ccc',
                fontSize: 14,
              }}
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
              step="any"
              placeholder="550"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #ccc',
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
              Статус наявності
            </label>
            <select
              value={form.status === 'in_stock' ? 'active' : form.status || 'active'}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value,
                  production_time:
                    e.target.value === 'pre_order'
                      ? '2-4 дні під замовлення'
                      : 'В наявності',
                })
              }
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #ccc',
                fontSize: 14,
                background: '#fff',
              }}
            >
              <option value="active">В наявності</option>
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
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #ccc',
                fontSize: 14,
              }}
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
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #ccc',
                fontSize: 14,
              }}
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
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #ccc',
                fontSize: 14,
              }}
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
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #ccc',
                fontSize: 14,
              }}
            />
          </div>

          {/* CUSTOM PHOTOS & IMAGES SECTION */}
          <div
            style={{
              gridColumn: '1 / -1',
              background: '#f9fafb',
              borderRadius: 14,
              padding: 16,
              border: '1px solid #e5e7eb',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <label style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
                📷 Фотографії товару {form.images?.length > 0 && `(${form.images.length})`}
              </label>
              <span style={{ fontSize: 12, color: '#6b7280' }}>
                Перше фото буде головною обкладинкою
              </span>
            </div>

            {/* Drag and Drop Zone / File Picker */}
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
                backgroundColor: isDragging ? 'rgba(96, 108, 56, 0.08)' : '#ffffff',
                borderRadius: 12,
                padding: '22px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: 14,
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />
              <div style={{ fontSize: 32, marginBottom: 4 }}>📸</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2937', marginBottom: 4 }}>
                {uploadingImages
                  ? 'Оптимізація та завантаження фото...'
                  : 'Натисніть сюди або перетягніть фотографії з пристрою'}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                Підтримуються будь-які формати (JPG, PNG, WEBP). Можна вибрати декілька фото одразу!
              </div>
            </div>

            {/* Direct URL input */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 14,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <input
                type="url"
                placeholder="Або вставте посилання на фото (https://...)"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 220,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  fontSize: 13,
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomUrl}
                style={{
                  padding: '8px 14px',
                  fontSize: 13,
                  borderRadius: 8,
                  background: '#e5e7eb',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                + Додати URL
              </button>
            </div>

            {/* Quick Presets */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
                Швидкі стандартні шаблони:
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PRESET_IMAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddPresetImage(preset.url)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      borderRadius: 20,
                      border: '1px solid #d1d5db',
                      background: '#fff',
                      cursor: 'pointer',
                      color: '#374151',
                    }}
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Uploaded Gallery Thumbnails */}
            {form.images && form.images.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: 8,
                  }}
                >
                  Обрані зображення товару:
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {form.images.map((img, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        width: 90,
                        height: 90,
                        borderRadius: 10,
                        overflow: 'hidden',
                        border: idx === 0 ? '2px solid #283618' : '1px solid #d1d5db',
                        background: '#e5e7eb',
                        boxShadow: idx === 0 ? '0 0 0 2px rgba(40, 54, 24, 0.2)' : 'none',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- blob preview before upload */}
                      <img
                        src={img}
                        alt={`Фото ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />

                      {idx === 0 ? (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: '#283618',
                            color: '#fff',
                            fontSize: 9,
                            fontWeight: 700,
                            textAlign: 'center',
                            padding: '2px 0',
                            letterSpacing: 0.5,
                          }}
                        >
                          ГОЛОВНЕ
                        </div>
                      ) : (
                        <button
                          type="button"
                          title="Зробити головним фото"
                          onClick={() => handleSetPrimaryImage(idx)}
                          style={{
                            position: 'absolute',
                            bottom: 4,
                            left: 4,
                            background: 'rgba(255,255,255,0.92)',
                            color: '#111827',
                            border: 'none',
                            borderRadius: 4,
                            padding: '2px 4px',
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          ⭐ Головне
                        </button>
                      )}

                      <button
                        type="button"
                        title="Видалити фото"
                        onClick={() => handleRemoveImage(idx)}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.65)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          lineHeight: 1,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #ccc',
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: 10 }}>
            <button
              type="submit"
              disabled={loading || uploadingImages}
              className="btn btn--primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: 15,
                borderRadius: 12,
                fontWeight: 600,
              }}
            >
              {loading
                ? 'Збереження товару...'
                : editingProduct
                ? 'Зберегти зміни ✓'
                : 'Зберегти товар у каталог ✓'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
