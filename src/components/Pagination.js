import Link from 'next/link';

export default function Pagination({ currentPage, totalPages, basePath, searchParams = {} }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  function buildHref(page) {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="pagination">
      <Link
        href={buildHref(currentPage - 1)}
        className="pagination__btn"
        aria-label="Попередня сторінка"
        style={currentPage <= 1 ? { pointerEvents: 'none', opacity: 0.3 } : {}}
      >
        ←
      </Link>
      {start > 1 && (
        <>
          <Link href={buildHref(1)} className="pagination__btn">1</Link>
          {start > 2 && <span style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>}
        </>
      )}
      {pages.map(page => (
        <Link
          key={page}
          href={buildHref(page)}
          className={`pagination__btn ${page === currentPage ? 'active' : ''}`}
        >
          {page}
        </Link>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>}
          <Link href={buildHref(totalPages)} className="pagination__btn">{totalPages}</Link>
        </>
      )}
      <Link
        href={buildHref(currentPage + 1)}
        className="pagination__btn"
        aria-label="Наступна сторінка"
        style={currentPage >= totalPages ? { pointerEvents: 'none', opacity: 0.3 } : {}}
      >
        →
      </Link>
    </div>
  );
}
