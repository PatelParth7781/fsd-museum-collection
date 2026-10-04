import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, GalleryVerticalEnd, X, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { logAction } from '@/lib/audit';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { FormField, TextInput, TextArea, SelectField } from '@/components/ui/FormField';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { GridSkeleton } from '@/components/ui/Loading';
import type { Exhibition, Location, ArtifactWithRelations, ExhibitionWithRelations } from '@/types';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700', upcoming: 'bg-blue-100 text-blue-700',
  ended: 'bg-stone-100 text-stone-600', cancelled: 'bg-red-100 text-red-700',
};

export default function AdminExhibitions() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [exhibitions, setExhibitions] = useState<ExhibitionWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExhibitionWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [manageTarget, setManageTarget] = useState<ExhibitionWithRelations | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [form, setForm] = useState({ name: '', description: '', start_date: '', end_date: '', location_id: '', status: 'upcoming', cover_image_url: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [availableArtifacts, setAvailableArtifacts] = useState<ArtifactWithRelations[]>([]);
  const [currentArtifacts, setCurrentArtifacts] = useState<ArtifactWithRelations[]>([]);
  const [artifactSearch, setArtifactSearch] = useState('');

  useEffect(() => {
    api.get('/locations').then((data) => setLocations(data ?? []));
  }, []);

  const fetchExhibitions = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.get('/exhibitions');
      setExhibitions(data ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchExhibitions(); }, [fetchExhibitions]);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: '', description: '', start_date: '', end_date: '', location_id: '', status: 'upcoming', cover_image_url: '' });
    setModalOpen(true);
  };

  const openEdit = (exh: ExhibitionWithRelations) => {
    setEditTarget(exh);
    setForm({
      name: exh.name,
      description: exh.description,
      start_date: exh.start_date ? exh.start_date.split('T')[0] : '',
      end_date: exh.end_date ? exh.end_date.split('T')[0] : '',
      location_id: exh.location_id ?? (exh.location?.id || ''),
      status: exh.status,
      cover_image_url: exh.cover_image_url ?? '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast('Exhibition name is required', 'error'); return; }
    setFormLoading(true);
    const payload = { ...form, start_date: form.start_date || null, end_date: form.end_date || null, location_id: form.location_id || null, cover_image_url: form.cover_image_url || null };
    try {
      if (editTarget) {
        await api.put(`/exhibitions/${editTarget.id}`, payload);
        toast('Exhibition updated', 'success');
        await logAction('exhibition_updated', 'exhibition', editTarget.id, `Exhibition "${form.name}" updated by ${profile?.email}`);
      } else {
        const data = await api.post('/exhibitions', payload);
        toast('Exhibition created', 'success');
        await logAction('exhibition_created', 'exhibition', data.id, `Exhibition "${form.name}" created by ${profile?.email}`);
      }
      setModalOpen(false);
      fetchExhibitions();
    } catch (err: any) {
      toast(err.message || 'Operation failed', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.del(`/exhibitions/${deleteTarget}`);
      toast('Exhibition deleted', 'success');
      fetchExhibitions();
    } catch {
      toast('Failed to delete exhibition', 'error');
    }
  };

  const openManage = async (exh: Exhibition) => {
    setManageTarget(exh);
    setArtifactSearch('');
    try {
      const [exhData, available] = await Promise.all([
        api.get(`/exhibitions/${exh.id}`),
        api.get('/artifacts', { is_public: true, limit: 50 }),
      ]);
      const current = (exhData?.exhibition_artifacts ?? []).map((ea: any) => ea.artifact || ea.artifact_id).filter(Boolean);
      setCurrentArtifacts(current);
      setAvailableArtifacts(available?.artifacts ?? []);
    } catch {
      // ignore
    }
  };

  const addArtifact = async (artifactId: string) => {
    if (!manageTarget) return;
    try {
      await api.post(`/exhibitions/${manageTarget.id}/artifacts`, { artifact_id: artifactId });
      toast('Artifact added to exhibition', 'success');
      openManage(manageTarget);
      fetchExhibitions();
    } catch (err: any) {
      toast(err.message || 'Failed to add artifact', 'error');
    }
  };

  const removeArtifact = async (artifactId: string) => {
    if (!manageTarget) return;
    try {
      await api.del(`/exhibitions/${manageTarget.id}/artifacts/${artifactId}`);
      toast('Artifact removed from exhibition', 'info');
      openManage(manageTarget);
      fetchExhibitions();
    } catch (err: any) {
      toast(err.message || 'Failed to remove artifact', 'error');
    }
  };

  const filtered = exhibitions.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));
  const filteredAvailable = availableArtifacts.filter((a) => !currentArtifacts.some((c) => c.id === a.id) && a.name.toLowerCase().includes(artifactSearch.toLowerCase()));

  return (
    <DashboardLayout title="Exhibition Management">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exhibitions..." className="input-field pl-10" />
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={18} /> Create Exhibition</button>
      </div>

      {loading ? <GridSkeleton count={6} /> : error ? <ErrorState onRetry={fetchExhibitions} /> : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={<GalleryVerticalEnd size={48} strokeWidth={1.5} />} title="No exhibitions found" message="Create your first exhibition to get started." action={<button onClick={openCreate} className="btn-primary"><Plus size={16} /> Create Exhibition</button>} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((exh) => (
            <div key={exh.id} className="card p-5">
              <div className="flex items-start justify-between mb-2">
                <span className={`badge ${statusColors[exh.status]}`}>{exh.status}</span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(exh)} className="p-1.5 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50" aria-label="Edit"><Pencil size={16} /></button>
                  <button onClick={() => setDeleteTarget(exh.id)} className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50" aria-label="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 className="font-serif font-semibold text-stone-800 mb-1">{exh.name}</h3>
              <p className="text-sm text-stone-500 line-clamp-2 mb-2">{exh.description}</p>
              {exh.start_date && exh.end_date && <p className="text-xs text-stone-400 mb-1">{new Date(exh.start_date).toLocaleDateString()} — {new Date(exh.end_date).toLocaleDateString()}</p>}
              {exh.location && <p className="text-xs text-stone-400 mb-3">{exh.location.building} — {exh.location.gallery}</p>}
              <p className="text-xs text-stone-500 mb-3">{exh.exhibition_artifacts?.length ?? 0} artifacts</p>
              <button onClick={() => openManage(exh)} className="btn-secondary w-full text-sm">Manage Artifacts</button>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Exhibition' : 'Create Exhibition'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Exhibition Name" required>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Echoes of the Ancients" />
          </FormField>
          <FormField label="Description">
            <TextArea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date"><TextInput type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></FormField>
            <FormField label="End Date"><TextInput type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Location">
              <SelectField value={form.location_id} onChange={(e) => setForm({ ...form, location_id: e.target.value })}>
                <option value="">Select location...</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.building} — {l.gallery}</option>)}
              </SelectField>
            </FormField>
            <FormField label="Status">
              <SelectField value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="upcoming">Upcoming</option><option value="active">Active</option>
                <option value="ended">Ended</option><option value="cancelled">Cancelled</option>
              </SelectField>
            </FormField>
          </div>
          <FormField label="Cover Image URL" help="Paste a direct image URL for the exhibition cover">
            <TextInput value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} placeholder="https://..." />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={formLoading} className="btn-primary">{formLoading ? 'Saving...' : editTarget ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Manage Artifacts Modal */}
      <Modal open={!!manageTarget} onClose={() => setManageTarget(null)} title={`Manage Artifacts — ${manageTarget?.name ?? ''}`} size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-stone-700 mb-3">Current Artifacts ({currentArtifacts.length})</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
              {currentArtifacts.length === 0 ? <p className="text-sm text-stone-400">No artifacts added yet.</p> : currentArtifacts.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-100">
                  <div className="flex items-center gap-2">
                    {a.artifact_images?.[0] && <img src={a.artifact_images[0].image_url} alt={a.name} className="w-10 h-10 rounded object-cover" />}
                    <div><p className="text-sm font-medium text-stone-700">{a.name}</p><p className="text-xs text-stone-400">{a.accession_number}</p></div>
                  </div>
                  <button onClick={() => removeArtifact(a.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><X size={16} /></button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-stone-700 mb-3">Add Artifacts</h4>
            <input type="text" value={artifactSearch} onChange={(e) => setArtifactSearch(e.target.value)} placeholder="Search artifacts..." className="input-field mb-3" />
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
              {filteredAvailable.length === 0 ? <p className="text-sm text-stone-400">No artifacts available to add.</p> : filteredAvailable.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-stone-50 border border-stone-100">
                  <div className="flex items-center gap-2">
                    {a.artifact_images?.[0] && <img src={a.artifact_images[0].image_url} alt={a.name} className="w-10 h-10 rounded object-cover" />}
                    <div><p className="text-sm font-medium text-stone-700">{a.name}</p><p className="text-xs text-stone-400">{a.accession_number}</p></div>
                  </div>
                  <button onClick={() => addArtifact(a.id)} className="btn-ghost text-sm text-amber-700">Add</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Exhibition" message="Are you sure you want to delete this exhibition? This cannot be undone." confirmLabel="Delete" danger />
    </DashboardLayout>
  );
}
