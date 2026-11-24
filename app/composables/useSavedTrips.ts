export function useSavedTrips() {
  const savedIds = useState<string[]>('jejaknusa-saved-trips', () => [
    'trip-canyoning-gitgit-bali',
    'trip-diving-komodo-ntt'
  ])

  function isSaved(tripId: string): boolean {
    return savedIds.value.includes(tripId)
  }

  function toggleSaved(tripId: string) {
    if (savedIds.value.includes(tripId)) {
      savedIds.value = savedIds.value.filter((id) => id !== tripId)
    } else {
      savedIds.value = [...savedIds.value, tripId]
    }
  }

  return {
    savedIds,
    isSaved,
    toggleSaved
  }
}
