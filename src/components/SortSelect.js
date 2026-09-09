'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function SortSelect({ currentSort }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (e) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', e.target.value);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      name="sort"
      value={currentSort || 'created_at'}
      onChange={handleChange}
    >
      <option value="created_at">Новинки</option>
      <option value="price_asc">Ціна: від низької</option>
      <option value="price_desc">Ціна: від високої</option>
      <option value="name">За назвою</option>
    </select>
  );
}
