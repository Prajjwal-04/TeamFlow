import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils';
import Modal from '../components/shared/Modal';
import { EmptyState, Avatar } from '../components/shared/index.jsx';
import CreateProjectForm from '../components/projects/CreateProjectForm';
import LoadingSpinner from '../components/shared/LoadingSpinner';

function ProjectCard({ project, onDelete, isAdmin }) {
  const progress = project.taskCount > 0
    ? Math.round((project.completedTaskCount / project.taskCount) * 100)
    : 0;

  const statusColors = {
    active: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    completed: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    archived: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
  };

  return (
    <div className="card p-5 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: project.color }}>
            {project.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <Link to={`/projects/${project._id}`}
              className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1">
              {project.name}
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              by {project.owner?.name}
            </p>
          </div>
        </div>
        <span className={`badge text-[10px] capitalize ${statusColors[project.status]}`}>
          {project.status}
        </span>
      </div>

      {project.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">{project.description}</p>
      )}

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-500">{project.completedTaskCount}/{project.taskCount} tasks</span>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{progress}%</span>
        </div>
        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: project.color }} />
        </div>
      </div>

      {/* Members */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {project.members?.slice(0, 4).map(m => (
            <div key={m.user?._id} title={m.user?.name}
              className="ring-2 ring-white dark:ring-slate-900 rounded-lg">
              <Avatar user={m.user} size="xs" />
            </div>
          ))}
          {project.members?.length > 4 && (
            <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-900
              flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300">
              +{project.members.length - 4}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {project.dueDate && (
            <span className="text-xs text-slate-400">{formatDate(project.dueDate, 'MMM d')}</span>
          )}
          <Link to={`/projects/${project._id}`}
            className="text-xs text-indigo-500 hover:text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Open →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { data } = await projectsAPI.getAll();
      setProjects(data.projects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="input w-48 h-9 text-sm"
          />
          {isAdmin && (
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
              <span className="text-lg leading-none">+</span> New Project
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="◫"
          title={search ? 'No projects found' : 'No projects yet'}
          description={search ? 'Try a different search term' : isAdmin ? 'Create your first project to get started' : 'You have not been added to any projects yet'}
          action={isAdmin && !search && (
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Create Project
            </button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(project => (
            <ProjectCard key={project._id} project={project} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Project">
        <CreateProjectForm
          onSuccess={(project) => {
            setProjects(prev => [project, ...prev]);
            setShowCreate(false);
          }}
          onClose={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
}
