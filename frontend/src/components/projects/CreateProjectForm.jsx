import { useState } from 'react';
import { projectsAPI } from '../../api';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function CreateProjectForm({ onSuccess, onClose, initial }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    color: initial?.color || '#6366f1',
    dueDate: initial?.dueDate ? initial.dueDate.slice(0, 10) : '',
    memberEmails: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        color: form.color,
        dueDate: form.dueDate || undefined,
        memberEmails: form.memberEmails
          ? form.memberEmails.split(',').map(e => e.trim()).filter(Boolean)
          : []
      };
      const { data } = initial
        ? await projectsAPI.update(initial._id, payload)
        : await projectsAPI.create(payload);
      onSuccess(data.project);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="label">Project Name *</label>
        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
          className="input" placeholder="e.g. Website Redesign" required maxLength={100} />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
          className="input resize-none" rows={3} placeholder="What's this project about?"
          maxLength={500} />
      </div>

      <div>
        <label className="label">Color</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map(color => (
            <button key={color} type="button" onClick={() => setForm({ ...form, color })}
              className={`w-7 h-7 rounded-lg transition-transform hover:scale-110 ${form.color === color ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-current scale-110' : ''}`}
              style={{ background: color }} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Due Date</label>
          <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
            className="input" min={new Date().toISOString().slice(0, 10)} />
        </div>
      </div>

      {!initial && (
        <div>
          <label className="label">Invite Members (emails)</label>
          <input type="text" value={form.memberEmails}
            onChange={e => setForm({ ...form, memberEmails: e.target.value })}
            className="input" placeholder="alice@co.com, bob@co.com" />
          <p className="text-xs text-slate-400 mt-1">Comma-separated emails of registered users</p>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : initial ? 'Update Project' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}
