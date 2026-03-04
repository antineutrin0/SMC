// ─── Loading Spinner ─────────────────────────────────────────
export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizes[size]}`} />
    </div>
  );
}

// ─── Page Loading ─────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon className="w-12 h-12 text-muted-foreground/40 mb-4" />}
      <h3 className="text-lg font-medium text-muted-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Error Message ───────────────────────────────────────────
export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
      <p className="text-red-500 text-sm">{message || 'Something went wrong'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-blue-600 underline underline-offset-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ─── Stats Card ──────────────────────────────────────────────
export function StatsCard({ title, value, icon: Icon, color = 'blue', loading }) {
  const colors = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    purple: 'text-purple-600 bg-purple-50',
    red: 'text-red-600 bg-red-50',
  };
  return (
    <div className="bg-white rounded-xl border p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        {Icon && <Icon className="w-6 h-6" />}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        {loading ? (
          <div className="h-7 w-16 bg-gray-100 animate-pulse rounded mt-1" />
        ) : (
          <p className="text-2xl font-bold">{value ?? 0}</p>
        )}
      </div>
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─── Responsive Table Wrapper ────────────────────────────────
export function TableWrapper({ children }) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-lg">
      {children}
    </div>
  );
}

// ─── Status Badge helper ─────────────────────────────────────
export function getStatusVariant(status) {
  const map = {
    Active: 'default', Approved: 'default', 'APPROVED': 'default',
    Inactive: 'secondary', Pending: 'secondary', Draft: 'secondary', 'PENDING': 'secondary',
    Rejected: 'destructive', 'REJECTED': 'destructive',
  };
  return map[status] || 'secondary';
}
