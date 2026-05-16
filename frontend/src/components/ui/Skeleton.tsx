export const SkeletonRow = () => (
  <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
    {Array.from({ length: 6 }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="skeleton h-4 w-full" style={{ opacity: 0.6 }} />
      </td>
    ))}
  </tr>
);

export const SkeletonCard = () => (
  <div className="card p-5 space-y-3">
    <div className="skeleton h-6 w-1/3" />
    <div className="skeleton h-4 w-1/2" />
    <div className="skeleton h-4 w-2/3" />
  </div>
);

export const StatCardSkeleton = () => (
  <div className="card p-5 space-y-3">
    <div className="skeleton h-4 w-24" />
    <div className="skeleton h-8 w-16" />
    <div className="skeleton h-3 w-32" />
  </div>
);
