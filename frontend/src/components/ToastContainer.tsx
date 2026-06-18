import { useToastStore } from '../store';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  const bgMap: Record<string, string> = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  const iconMap: Record<string, string> = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${bgMap[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[280px] max-w-[420px] animate-slide-in`}
        >
          <span className="text-lg font-bold flex-shrink-0">{iconMap[toast.type]}</span>
          <p className="text-sm flex-1">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/80 hover:text-white ml-2 flex-shrink-0"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
