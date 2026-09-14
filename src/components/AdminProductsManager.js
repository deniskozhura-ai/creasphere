'use client';

import { useState, useEffect } from 'react';
import ProductForm from './admin/ProductForm';
import ProductsTable from './admin/ProductsTable';

export default function AdminProductsManager({ initialProducts }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(
    !initialProducts || initialProducts.length === 0
  );
  const [categories, setCategories] = useState([
    { id: '1', name: 'Подарунки ручної роботи' },
    { id: '2', name: 'Сувеніри та декор' },
    { id: '3', name: 'Творчі набори' },
    { id: '4', name: 'Дитячі іграшки' },
  ]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setProducts(data);
      }
    } catch (e) {
      console.error('Failed to refresh products:', e);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      })
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingProduct(item);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (payload, editingId) => {
    setLoading(true);
    try {
      if (editingId) {
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        const data = await res.json();
        if (res.ok && data.product) {
          setProducts((prev) =>
            prev.map((p) => (p.id === editingId ? data.product : p))
          );
          setIsModalOpen(false);
          setSuccessMsg(`Товар «${data.product.name}» успішно оновлено!`);
          setTimeout(() => setSuccessMsg(''), 4000);
          return null;
        }
        return data.error || 'Помилка при оновленні товару';
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.product) {
          setProducts((prev) => [data.product, ...prev]);
          setIsModalOpen(false);
          setSuccessMsg(`Новий товар «${data.product.name}» успішно додано до каталогу!`);
          setTimeout(() => setSuccessMsg(''), 4000);
          return null;
        }
        return data.error || 'Помилка при додаванні товару';
      }
    } catch (err) {
      return 'Не вдалося зберегти товар: ' + err.message;
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDelete = (item) => {
    setConfirmDeleteProduct(item);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteProduct) return;
    const item = confirmDeleteProduct;
    setDeletingId(item.id);
    try {
      const res = await fetch(`/api/products?id=${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setProducts((prev) =>
          prev.filter((p) => p.id !== item.id && p.sku !== item.id && p.sku !== item.sku)
        );
        setSuccessMsg(`Товар «${item.name}» успішно видалено з каталогу!`);
        setTimeout(() => setSuccessMsg(''), 4000);
        setConfirmDeleteProduct(null);
        await fetchProducts();
      } else {
        alert(data.error || 'Помилка при видаленні товару з бази даних');
      }
    } catch (err) {
      console.error(err);
      alert('Помилка з’єднання при видаленні товару');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {/* Success Notification Banner */}
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

      <ProductsTable
        products={products}
        loadingProducts={loadingProducts}
        search={search}
        onSearchChange={setSearch}
        onOpenAdd={handleOpenAddModal}
        onEdit={handleOpenEditModal}
        onDelete={handleRequestDelete}
        deletingId={deletingId}
        confirmDeleteProduct={confirmDeleteProduct}
        onConfirmDelete={handleConfirmDelete}
        onCancelDelete={() => setConfirmDeleteProduct(null)}
      />

      <ProductForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingProduct={editingProduct}
        categories={categories}
        onSave={handleSaveProduct}
        loading={loading}
      />
    </div>
  );
}
