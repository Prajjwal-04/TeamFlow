import { useState, useEffect } from 'react';
import { dashboardAPI } from '../api';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../utils';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CalendarPage() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => { loadTasks(); }, [year, month]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data } = await dashboardAPI.getCalendar({ month: month + 1, year });
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getTasksForDay = (day) => {
    if (!day) return [];
    return tasks.filter(t => {
      const d = new Date(t.dueDate);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const isToday = (day) => {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const selectedDayTasks = selected ? getTasksForDay(selected) : [];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calendar</h1>
          <p className="text-sm text-slate-500 mt-0.5">{tasks.length} tasks with due dates this month</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="btn-secondary w-9 h-9 flex items-center justify-center text-lg p-0">‹</button>
          <span className="font-semibold text-slate-800 dark:text-slate-200 min-w-36 text-center">
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} className="btn-secondary w-9 h-9 flex items-center justify-center text-lg p-0">›</button>
          <button onClick={() => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="btn-secondary text-xs">Today</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Calendar grid */}
        <div className="lg:col-span-3 card overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
            {DAYS.map(d => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                const dayTasks = day ? getTasksForDay(day) : [];
                const hasOverdue = dayTasks.some(t => t.status !== 'done');
                const isSelected = selected === day;

                return (
                  <div
                    key={i}
                    onClick={() => day && setSelected(isSelected ? null : day)}
                    className={`min-h-[80px] p-1.5 border-b border-r border-slate-100 dark:border-slate-800
                      ${day ? 'cursor-pointer' : ''}
                      ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : day ? 'hover:bg-slate-50 dark:hover:bg-slate-800/30' : 'bg-slate-50/50 dark:bg-slate-800/20'}
                      transition-colors`}
                  >
                    {day && (
                      <>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium mb-1 mx-auto
                          ${isToday(day)
                            ? 'bg-indigo-500 text-white'
                            : 'text-slate-700 dark:text-slate-300'}`}>
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {dayTasks.slice(0, 2).map(t => {
                            const isOverdue = new Date(t.dueDate) < today && t.status !== 'done';
                            const dot = PRIORITY_CONFIG[t.priority]?.dot || 'bg-slate-400';
                            return (
                              <div key={t._id}
                                className={`text-[9px] font-medium px-1.5 py-0.5 rounded truncate flex items-center gap-1
                                  ${isOverdue
                                    ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                    : t.status === 'done'
                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                    : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'}`}>
                                <span className={`w-1 h-1 rounded-full shrink-0 ${dot}`} />
                                {t.title}
                              </div>
                            );
                          })}
                          {dayTasks.length > 2 && (
                            <p className="text-[9px] text-slate-400 text-center">+{dayTasks.length - 2} more</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: selected day tasks */}
        <div className="card p-4">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
            {selected
              ? `${MONTHS[month]} ${selected}`
              : 'Click a date'}
          </h3>

          {selected && selectedDayTasks.length === 0 && (
            <p className="text-sm text-slate-400">No tasks due this day</p>
          )}

          <div className="space-y-2">
            {selectedDayTasks.map(task => {
              const isOverdue = new Date(task.dueDate) < today && task.status !== 'done';
              const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
              const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;

              return (
                <div key={task._id}
                  className={`p-3 rounded-xl border text-sm
                    ${isOverdue
                      ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'}`}>
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${priorityCfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{task.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{task.project?.name}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`badge text-[9px] ${statusCfg.bg} ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        <span className={`badge text-[9px] ${priorityCfg.bg} ${priorityCfg.color}`}>
                          {priorityCfg.label}
                        </span>
                        {isOverdue && (
                          <span className="badge text-[9px] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                            Overdue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Month summary */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Month Summary</p>
            <div className="space-y-1.5">
              {[
                { label: 'Total', count: tasks.length, color: 'text-slate-700 dark:text-slate-300' },
                { label: 'Done', count: tasks.filter(t => t.status === 'done').length, color: 'text-green-600 dark:text-green-400' },
                { label: 'Overdue', count: tasks.filter(t => new Date(t.dueDate) < today && t.status !== 'done').length, color: 'text-red-500' }
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{row.label}</span>
                  <span className={`font-bold ${row.color}`}>{row.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
