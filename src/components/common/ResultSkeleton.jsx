export default function ResultSkeleton() {
  return (
    <div className="skeleton" aria-hidden="true">
      <div className="skeleton-line w-90" />
      <div className="skeleton-line w-75" />
      <div className="skeleton-line w-95" />
      <div className="skeleton-gap" />
      <div className="skeleton-line w-60" />
      <div className="skeleton-line w-85" />
      <div className="skeleton-line w-70" />
      <div className="skeleton-gap" />
      <div className="skeleton-card" />
      <div className="skeleton-card" />
      <div className="skeleton-card short" />
    </div>
  )
}
