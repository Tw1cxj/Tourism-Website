import { useEffect } from 'react';
import { getTourismRepository } from './tourismStore';

export default function useSearchTelemetry(user, category, filters) {
  useEffect(() => {
    if (user?.role !== 'user') return;
    const timer = setTimeout(() => getTourismRepository().recordActivity(user, 'search', { category }), 600);
    return () => clearTimeout(timer);
  }, [user, category, filters]);
}
