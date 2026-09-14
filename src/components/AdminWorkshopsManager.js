'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import WorkshopForm from './admin/WorkshopForm';
import WorkshopsTable from './admin/WorkshopsTable';

export default function AdminWorkshopsManager() {
  const { showToast } = useToast();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');

  // Modal & deletion state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteWorkshop, setConfirmDeleteWorkshop] = useState(null);

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
    setIsModalOpen(true);
  };

  const openEditModal = (w) => {
    setEditingWorkshop(w);
    setIsModalOpen(true);
  };

  const handleSaveWorkshop = async (payload, isEditing) => {
    setSaving(true);
    try {
      const url = '/api/workshops';
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing ? { ...payload, id: editingWorkshop.id } : payload;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchWorkshops();
        setSuccessMsg(isEditing ? 'Майстер-клас оновлено!' : 'Майстер-клас додано до каталогу!');
        setTimeout(() => setSuccessMsg(''), 4000);
        return null;
      }
      return data.error || 'Помилка збереження';
    } catch (err) {
      return 'Помилка запиту: ' + err.message;
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
        showToast(`Майстер-клас «${w.title}» успішно видалено!`, 'success');
      } else {
        showToast(data.error || 'Помилка при видаленні майстер-класу', 'error');
      }
    } catch (err) {
      showToast('Помилка з’єднання при видаленні майстер-класу', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
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

      <WorkshopsTable
        workshops={workshops}
        loading={loading}
        error={error}
        search={search}
        onSearchChange={setSearch}
        onOpenCreate={openCreateModal}
        onEdit={openEditModal}
        onDelete={(w) => setConfirmDeleteWorkshop(w)}
        deletingId={deletingId}
        confirmDeleteWorkshop={confirmDeleteWorkshop}
        onConfirmDelete={() => handleDelete(confirmDeleteWorkshop)}
        onCancelDelete={() => setConfirmDeleteWorkshop(null)}
      />

      <WorkshopForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingWorkshop={editingWorkshop}
        onSave={handleSaveWorkshop}
        saving={saving}
      />
    </div>
  );
}
