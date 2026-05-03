import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { dashboardAPI, activityAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatRelative, PRIORITY_CONFIG, STATUS_CONFIG } from '../utils';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { Avatar } from '../components/shared/index.jsx';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{sub}</span>
      </div>
      <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, actRes] = await Promise.all([
          dashboardAPI.getStats(),
          activityAPI.getAll({ limit: 8 })
        ]);
        setStats(statsRes.data);
        setActivities(actRes.data.activities || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const s = stats?.stats || {};
  const charts = stats?.charts || {};
  const upcoming = stats?.myUpcomingTasks || [];
  const projects = stats?.projectsWithStats || [];

  const statusChartData = [
    { name: 'To Do', value: charts.tasksByStatus?.find(t => t.name === 'todo')?.value || 0 },
    { name: 'In Progress', value: charts.tasksByStatus?.find(t => t.name === 'in_progress')?.value || 0 },
    { name: 'Done', value: charts.tasksByStatus?.find(t => t.name === 'done')?.value || 0 }
  ];

  const priorityData = charts.tasksByPriority?.map(t => ({
    name: PRIORITY_CONFIG[t.name]?.label || t.name,
    value: t.value
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          <span className="text-indigo-500">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Tasks"
          value={s.totalTasks || 0}
          icon="📋"
          color="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
          sub={`${s.totalProjects || 0} projects`}
        />
        <StatCard
          label="Completed"
          value={s.completedTasks || 0}
          icon="✅"
          color="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
          sub={`${s.completionRate || 0}% rate`}
        />
        <StatCard
          label="Overdue"
          value={s.overdueTasks || 0}
          icon="⚠️"
          color={s.overdueTasks > 0
            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
            : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'}
          sub={s.overdueTasks > 0 ? 'Needs attention' : 'All on time'}
        />
        <StatCard
          label="My Tasks"
          value={s.myTasks || 0}
          icon="🎯"
          color="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
          sub={`${s.inProgressTasks || 0} in progress`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Completion trend */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Completion Trend (7 days)</h2>
          {charts.completionTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={charts.completionTrend}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} width={25} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Line type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={2.5}
                  dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
              No completion data yet
            </div>
          )}
        </div>

        {/* Status pie */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Tasks by Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                paddingAngle={3} dataKey="value">
                {statusChartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Priority chart */}
      {priorityData.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Tasks by Priority</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={priorityData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} width={60} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {priorityData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My upcoming tasks */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">My Upcoming Tasks</h2>
            <Link to="/tasks?assignedToMe=true" className="text-xs text-indigo-500 hover:text-indigo-600">View all</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No tasks assigned to you</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map(task => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
                return (
                  <div key={task._id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors
                    ${isOverdue
                      ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                    }`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_CONFIG[task.priority]?.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{task.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {task.project?.name} {task.dueDate && `• ${isOverdue ? '⚠ ' : ''}${formatDate(task.dueDate, 'MMM d')}`}
                      </p>
                    </div>
                    <span className={`badge text-[10px] ${STATUS_CONFIG[task.status]?.bg} ${STATUS_CONFIG[task.status]?.color}`}>
                      {STATUS_CONFIG[task.status]?.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Recent Activity</h2>
          {activities.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {activities.map(act => (
                <div key={act._id} className="flex items-start gap-3">
                  <Avatar user={act.user} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-medium">{act.user?.name}</span>{' '}
                      {act.details}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatRelative(act.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Projects progress */}
      {projects.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">Project Progress</h2>
            <Link to="/projects" className="text-xs text-indigo-500 hover:text-indigo-600">View all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map(proj => {
              const progress = proj.taskCount > 0
                ? Math.round((proj.completedTaskCount / proj.taskCount) * 100)
                : 0;
              return (
                <Link to={`/projects/${proj._id}`} key={proj._id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: proj.color }} />
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {proj.name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500">{proj.completedTaskCount}/{proj.taskCount} tasks</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%`, background: proj.color }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
