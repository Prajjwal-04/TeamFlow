import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center animate-slide-up">
        <div className="text-8xl font-black text-slate-200 dark:text-slate-800 mb-4">404</div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Page not found</h1>
        <p className="text-slate-500 mb-6">The page you're looking for doesn't exist.</p>
        <Link to="/dashboard" className="btn-primary inline-block">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
