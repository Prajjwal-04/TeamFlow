import { useState, useEffect } from 'react';
import { tasksAPI, projectsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks';
import { downloadBlob, PRIORITY_CONFIG, STATUS_CONFIG } from '../utils';
import TaskCard from '../components/tasks/TaskCard';
import TaskForm from '../components/tasks/TaskForm';
import Modal from '../components/shared/Modal';
import { EmptyState } from '../components/shared/index.jsx';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const PRIORITIES = ['', 'low', 'medium', 'high', 'critical'];
const STATUSES = ['', 'todo', 'in_progress', 'done'];

export default function TasksPage() {
  const { user, isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    project: '',
    overdue: false,
    assignedToMe: false
  });

  const debouncedSearch = useDebounce(filters.search, 350);

  useEffect(() => { projectsAPI.getAll().then(r => setProjects(r.data.projects || [])); }, []);

  useEffect(() => { loadTasks(); }, [debouncedSearch, filters.status, filters.priority, filters.project, filters.overdue, filters.assignedToMe]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params = {
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.project && { project: filters.project }),
        ...(filters.overdue && { overdue: 'true' }),
        ...(filters.assignedToMe && { assignedTo: user._id })
      };
      const { data } = await tasksAPI.getAll(params);
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = filters.project ? { project: filters.project } : {};
      const { data } = await tasksAPI.export(params);
      downloadBlob(data, 'tasks-export.csv');
    } catch (err) {
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  const activeFilterCount = [filters.status, filters.priority, filters.project, filters.overdue, filters.assignedToMe]
    .filter(Boolean).length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Tasks</h1>
          <p className="text-sm text-slate-500 mt-0.5">{tasks.length} task{tasks.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} disabled={exporting}
            className="btn-secondary text-xs flex items-center gap-1.5">
            {exporting ? <LoadingSpinner size="sm" /> : '⬇'}
            Export CSV
          </button>
          {isAdmin && (
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
              <span>+</span> New Task
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              placeholder="Search tasks..."
              className="input pl-8 h-9 text-sm"
            />
          </div>

          {/* Project filter */}
          <select value={filters.project} onChange={e => setFilter('project', e.target.value)}
            className="input h-9 text-sm w-40">
            <option value="">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>

          {/* Status filter */}
          <select value={filters.status} onChange={e => setFilter('status', e.target.value)}
            className="input h-9 text-sm w-36">
            <option value="">All Status</option>
            {STATUSES.slice(1).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s]?.label}</option>
            ))}
          </select>

          {/* Priority filter */}
          <select value={filters.priority} onChange={e => setFilter('priority', e.target.value)}
            className="input h-9 text-sm w-36">
            <option value="">All Priority</option>
            {PRIORITIES.slice(1).map(p => (
              <option key={p} value={p}>{PRIORITY_CONFIG[p]?.label}</option>
            ))}
          </select>

          {/* Quick toggles */}
          <button
            onClick={() => setFilter('overdue', !filters.overdue)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5
              ${filters.overdue
                ? 'bg-red-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20'}`}>
            ⚠ Overdue
          </button>

          <button
            onClick={() => setFilter('assignedToMe', !filters.assignedToMe)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${filters.assignedToMe
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'}`}>
            My Tasks
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={() => setFilters({ search: '', status: '', priority: '', project: '', overdue: false, assignedToMe: false })}
              className="text-xs text-slate-400 hover:text-slate-600 underline">
              Clear filters ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      {/* Task grid */}
      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon="✓"
          title="No tasks found"
          description={activeFilterCount > 0 ? 'Try adjusting your filters' : 'No tasks match your criteria'}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {tasks.map(task => (
            <TaskCard
              key={task._id}
              task={task}
              onUpdate={(updated) => setTasks(prev => prev.map(t => t._id === updated._id ? updated : t))}
              onDelete={(id) => setTasks(prev => prev.filter(t => t._id !== id))}
            />
          ))}
        </div>
      )}

      {/* Create task modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Task">
        <TaskForm
          projectId={filters.project || projects[0]?._id}
          projectMembers={projects.find(p => p._id === filters.project)?.members || []}
          onSuccess={(task) => { setTasks(prev => [task, ...prev]); setShowCreate(false); }}
          onClose={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
}
