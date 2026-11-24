/**
 * React hook for the events a tourist has saved. Saved events are kept in the
 * shared TourismRepository (GovernanceOperations.saveEventForTourist), so an
 * administrator's change or cancellation reaches the tourist's itinerary.
 */
import { useCallback, useMemo } from "react";
import useTourismStore from "./useTourismStore";
import { ROLES } from "./domain";

export default function useSavedEvents(user) {
  const [state, repository] = useTourismStore();
  const canSave = user?.role === ROLES.USER;
  const userId = user?.id;
  const allSaved = state.savedEvents;

  const savedEvents = useMemo(
    () => (canSave ? (allSaved ?? []).filter((s) => s.userId === userId).map((s) => s.eventId) : []),
    [allSaved, canSave, userId],
  );

  const toggleEvent = useCallback((eventId) => {
    try {
      repository.saveEventForTourist(user, eventId, savedEvents.includes(eventId));
    } catch (error) {
      window.alert(error.message);
    }
  }, [repository, user, savedEvents]);

  // Only tourists can save events; other roles see events without the "+ Add" button.
  return { savedEvents, toggleEvent: canSave ? toggleEvent : undefined };
}
