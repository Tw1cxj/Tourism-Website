import { useSyncExternalStore } from 'react';
import { getTourismRepository } from './tourismStore';

export default function useTourismStore() {
  const repository = getTourismRepository();
  const state = useSyncExternalStore(repository.subscribe, repository.getSnapshot, repository.getSnapshot);
  return [state, repository];
}
