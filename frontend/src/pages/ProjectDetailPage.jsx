import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectsAPI, tasksAPI, activityAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatRelative, PRIORITY_CONFIG, STATUS_CONFIG } from '../utils';
import Modal from '../components/shared/Modal';
import { ConfirmDialog, Avatar, EmptyState } from '../components/shared/index.jsx';
import CreateProjectForm from '../components/projects/CreateProjectForm';
import TaskForm from '../components/tasks/TaskForm';
import TaskCard from '../components/tasks/TaskCard';
import LoadingSpinner from '../components/shared/LoadingSpinner';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board');
  const [showEditProject, setShowEditProject] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [memberError, setMemberError] = useState('');

  const isProjectAdmin = isAdmin ||
    project?.members?.some(m => m.user?._id === user?._id && m.role === 'admin');

  useEffect(() => { loadAll(); }, [id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [projRes, taskRes, actRes] = await Promise.all([
        projectsAPI.getOne(id),
        tasksAPI.getAll({ project: id }),
        activityAPI.getAll({ project: id, limit: 15 })
      ]);
      setProject(projRes.data.project);
      setTasks(taskRes.data.tasks || []);
      setActivities(actRes.data.activities || []);
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 403) navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberError('');
    setMemberLoading(true);
    try {
      const { data } = await projectsAPI.addMember(id, { email: memberEmail });
      setProject(data.project);
      setMemberEmail('');
      setShowAddMember(false);
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await projectsAPI.removeMember(id, userId);
      setProject(prev => ({
        ...prev,
        members: prev.members.filter(m => m.user?._id !== userId)
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleDeleteProject = async () => {
    setDeleteLoading(true);
    try {
      await projectsAPI.delete(id);
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
      setDeleteLoading(false);
    }
  };

  const handleTaskUpdate = (updatedTask) => {
    setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
  };

  const handleTaskDelete = (taskId) => {
    setTasks(prev => prev.filter(t => t._id !== taskId));
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!project) return null;

  const progress = project.taskCount > 0
    ? Math.round((project.completedTaskCount / project.taskCount) * 100) : 0;

  const columns = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done')
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
              style={{ background: project.color }}>
              {project.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{project.name}</h1>
                <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize text-[10px]">
                  {project.status}
                </span>
              </div>
              {project.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{project.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isProjectAdmin && (
              <>
                <button onClick={() => setShowEditProject(true)} className="btn-secondary text-xs">Edit</button>
                <button onClick={() => setShowDelete(true)} className="btn-danger text-xs">Delete</button>
              </>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Total Tasks', val: project.taskCount },
            { label: 'Completed', val: project.completedTaskCount },
            { label: 'Members', val: project.members?.length },
            { label: 'Due Date', val: project.dueDate ? formatDate(project.dueDate) : 'No deadline' }
          ].map(s => (
            <div key={s.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{s.val}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Progress</span><span>{progress}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: project.color }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700">
        {['board', 'list', 'members', 'activity'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px
              ${activeTab === tab
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}>
            {tab}
          </button>
        ))}
        {isProjectAdmin && (
          <button onClick={() => setShowAddTask(true)}
            className="ml-auto btn-primary text-xs flex items-center gap-1.5">
            <span>+</span> Add Task
          </button>
        )}
      </div>

      {/* Board view */}
      {activeTab === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(columns).map(([status, statusTasks]) => (
            <div key={status} className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-3">
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  status === 'todo' ? 'bg-slate-400' :
                  status === 'in_progress' ? 'bg-blue-500' : 'bg-green-500'
                }`} />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {STATUS_CONFIG[status]?.label}
                </h3>
                <span className="ml-auto text-xs font-bold text-slate-500 bg-slate-200 dark:bg-slate-700
                  w-5 h-5 rounded-full flex items-center justify-center">
                  {statusTasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {statusTasks.map(task => (
                  <TaskCard key={task._id} task={task}
                    onUpdate={handleTaskUpdate} onDelete={handleTaskDelete}
                    projectMembers={project.members} />
                ))}
                {statusTasks.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-400">No tasks</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {activeTab === 'list' && (
        <div className="card overflow-hidden">
          {tasks.length === 0 ? (
            <EmptyState icon="✓" title="No tasks yet"
              description="Add tasks to this project to get started"
              action={isProjectAdmin && (
                <button onClick={() => setShowAddTask(true)} className="btn-primary">Add Task</button>
              )} />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {['Task', 'Assignee', 'Priority', 'Status', 'Due Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tasks.map(task => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
                  return (
                    <tr key={task._id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors
                      ${isOverdue ? 'bg-red-50/50 dark:bg-red-900/5' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{task.title}</p>
                        {task.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {task.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <Avatar user={task.assignedTo} size="xs" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">{task.assignedTo.name}</span>
                          </div>
                        ) : <span className="text-xs text-slate-400">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-[10px] ${PRIORITY_CONFIG[task.priority]?.bg} ${PRIORITY_CONFIG[task.priority]?.color}`}>
                          {PRIORITY_CONFIG[task.priority]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge text-[10px] ${STATUS_CONFIG[task.status]?.bg} ${STATUS_CONFIG[task.status]?.color}`}>
                          {STATUS_CONFIG[task.status]?.label}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-slate-500'}`}>
                        {task.dueDate ? `${isOverdue ? '⚠ ' : ''}${formatDate(task.dueDate)}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Members tab */}
      {activeTab === 'members' && (
        <div className="space-y-3">
          {isProjectAdmin && (
            <div className="card p-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">Add Member</h3>
              <form onSubmit={handleAddMember} className="flex gap-3">
                <input type="email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)}
                  placeholder="member@email.com" className="input flex-1" required />
                <button type="submit" disabled={memberLoading} className="btn-primary whitespace-nowrap">
                  {memberLoading ? 'Adding...' : 'Add Member'}
                </button>
              </form>
              {memberError && <p className="text-red-500 text-xs mt-2">{memberError}</p>}
            </div>
          )}
          <div className="card divide-y divide-slate-100 dark:divide-slate-800">
            {project.members?.map(m => (
              <div key={m.user?._id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Avatar user={m.user} size="sm" />
                  <div>
                    <p className="font-medium text-sm text-slate-800 dark:text-slate-200">
                      {m.user?.name}
                      {m.user?._id === user?._id && <span className="ml-1 text-xs text-slate-400">(you)</span>}
                    </p>
                    <p className="text-xs text-slate-500">{m.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge text-[10px] capitalize ${m.role === 'admin'
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                    {m.role}
                  </span>
                  {isProjectAdmin && m.user?._id !== project.owner?._id && m.user?._id !== user?._id && (
                    <button onClick={() => handleRemoveMember(m.user?._id)}
                      className="text-xs text-red-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity tab */}
      {activeTab === 'activity' && (
        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          {activities.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">No activity yet</p>
          ) : (
            activities.map(act => (
              <div key={act._id} className="flex items-start gap-3 p-4">
                <Avatar user={act.user} size="xs" />
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-medium">{act.user?.name}</span> {act.details}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatRelative(act.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={showEditProject} onClose={() => setShowEditProject(false)} title="Edit Project">
        <CreateProjectForm
          initial={project}
          onSuccess={(updated) => { setProject(updated); setShowEditProject(false); }}
          onClose={() => setShowEditProject(false)}
        />
      </Modal>

      <Modal isOpen={showAddTask} onClose={() => setShowAddTask(false)} title="Create Task">
        <TaskForm
          projectId={id}
          projectMembers={project.members}
          onSuccess={(task) => { setTasks(prev => [task, ...prev]); setShowAddTask(false); }}
          onClose={() => setShowAddTask(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDeleteProject}
        loading={deleteLoading}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? This will also delete all tasks. This cannot be undone.`}
      />
    </div>
  );
}
