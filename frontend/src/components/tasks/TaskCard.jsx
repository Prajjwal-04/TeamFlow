import { useState } from 'react';
import { tasksAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { formatDate, PRIORITY_CONFIG, STATUS_CONFIG } from '../../utils';
import Modal from '../shared/Modal';
import { ConfirmDialog, Avatar } from '../shared/index.jsx';
import TaskForm from './TaskForm';

export default function TaskCard({ task, onUpdate, onDelete, projectMembers = [] }) {
  const { user, isAdmin } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isAssignee = task.assignedTo?._id === user?._id || task.assignedTo === user?._id;
  const projectMember = projectMembers?.find(m => m.user?._id === user?._id || m.user === user?._id);
  const canEdit = isAdmin || projectMember?.role === 'admin';
  const canUpdateStatus = canEdit || isAssignee;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const due = task.dueDate ? formatDate(task.dueDate, 'MMM d') : null;

  const cycleStatus = async () => {
    if (!canUpdateStatus) return;
    const next = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
    const newStatus = next[task.status];
    setStatusLoading(true);
    try {
      const { data } = await tasksAPI.update(task._id, { status: newStatus });
      onUpdate(data.task);
    } catch (err) {
      console.error(err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await tasksAPI.delete(task._id);
      onDelete(task._id);
      setShowDelete(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
      setDeleteLoading(false);
    }
  };

  const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;

  return (
    <>
      <div className={`bg-white dark:bg-slate-900 rounded-xl border shadow-sm hover:shadow-md
        transition-all duration-200 p-3.5 cursor-pointer group
        ${isOverdue ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'}`}
        onClick={() => setShowDetail(true)}>

        {/* Priority dot + title */}
        <div className="flex items-start gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${priorityCfg.dot}`} />
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug line-clamp-2 flex-1">
            {task.title}
          </p>
        </div>

        {/* Tags */}
        {task.tags?.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-2 ml-4">
            {task.tags.slice(0, 3).map(tag => (
              <span key={tag} className="badge text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 ml-4" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            {/* Status toggle */}
            <button
              onClick={cycleStatus}
              disabled={statusLoading || !canUpdateStatus}
              title={canUpdateStatus ? 'Click to change status' : 'No permission'}
              className={`badge text-[10px] transition-colors ${statusCfg.bg} ${statusCfg.color}
                ${canUpdateStatus ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}>
              {statusLoading ? '...' : statusCfg.label}
            </button>

            {/* Priority */}
            <span className={`badge text-[10px] ${priorityCfg.bg} ${priorityCfg.color}`}>
              {priorityCfg.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Due date */}
            {due && (
              <span className={`text-[10px] font-medium ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                {isOverdue && '⚠ '}{due}
              </span>
            )}

            {/* Assignee */}
            {task.assignedTo && <Avatar user={task.assignedTo} size="xs" />}

            {/* Actions */}
            {canEdit && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={e => { e.stopPropagation(); setShowEdit(true); }}
                  className="w-6 h-6 rounded-md text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20
                    flex items-center justify-center text-xs transition-colors"
                  title="Edit">
                  ✎
                </button>
                <button onClick={e => { e.stopPropagation(); setShowDelete(true); }}
                  className="w-6 h-6 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                    flex items-center justify-center text-xs transition-colors"
                  title="Delete">
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Task Details" size="md">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${priorityCfg.dot}`} />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{task.title}</h3>
            </div>
            {task.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{task.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Status', value: <span className={`badge text-xs ${statusCfg.bg} ${statusCfg.color}`}>{statusCfg.label}</span> },
              { label: 'Priority', value: <span className={`badge text-xs ${priorityCfg.bg} ${priorityCfg.color}`}>{priorityCfg.label}</span> },
              { label: 'Due Date', value: due ? <span className={isOverdue ? 'text-red-500 font-medium' : ''}>{due}</span> : '—' },
              { label: 'Assigned To', value: task.assignedTo ? (
                <div className="flex items-center gap-1.5">
                  <Avatar user={task.assignedTo} size="xs" />
                  <span className="text-sm">{task.assignedTo.name}</span>
                </div>
              ) : 'Unassigned' }
            ].map(row => (
              <div key={row.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">{row.label}</p>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{row.value}</div>
              </div>
            ))}
          </div>

          {task.tags?.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1.5">Tags</p>
              <div className="flex gap-1.5 flex-wrap">
                {task.tags.map(tag => (
                  <span key={tag} className="badge bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {canEdit && (
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowDetail(false); setShowEdit(true); }} className="btn-secondary text-xs flex-1">
                Edit Task
              </button>
              <button onClick={() => { setShowDetail(false); setShowDelete(true); }} className="btn-danger text-xs flex-1">
                Delete
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Task">
        <TaskForm
          initial={task}
          projectId={task.project?._id || task.project}
          projectMembers={projectMembers}
          onSuccess={(updated) => { onUpdate(updated); setShowEdit(false); }}
          onClose={() => setShowEdit(false)}
        />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Task"
        message={`Delete "${task.title}"? This cannot be undone.`}
      />
    </>
  );
}
