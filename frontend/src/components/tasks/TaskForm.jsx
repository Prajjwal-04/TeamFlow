import { useState } from 'react';
import { tasksAPI } from '../../api';

export default function TaskForm({ projectId, projectMembers = [], onSuccess, onClose, initial }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    priority: initial?.priority || 'medium',
    status: initial?.status || 'todo',
    assignedTo: initial?.assignedTo?._id || initial?.assignedTo || '',
    dueDate: initial?.dueDate ? initial.dueDate.slice(0, 10) : '',
    tags: initial?.tags?.join(', ') || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        status: form.status,
        project: projectId,
        assignedTo: form.assignedTo || undefined,
        dueDate: form.dueDate || undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };
      const { data } = initial
        ? await tasksAPI.update(initial._id, payload)
        : await tasksAPI.create(payload);
      onSuccess(data.task);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const members = projectMembers.map(m => m.user).filter(Boolean);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="label">Title *</label>
        <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
          className="input" placeholder="What needs to be done?" required maxLength={200} />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
          className="input resize-none" rows={3} placeholder="Add more details..." maxLength={2000} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Priority</label>
          <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="input">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input">
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Assign To</label>
          <select value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} className="input">
            <option value="">Unassigned</option>
            {members.map(m => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Due Date</label>
          <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
            className="input" />
        </div>
      </div>

      <div>
        <label className="label">Tags</label>
        <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
          className="input" placeholder="frontend, bug, urgent (comma-separated)" />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : initial ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
