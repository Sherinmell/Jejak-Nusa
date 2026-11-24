export const WATCHABLE_DESTINATIONS = [
  'Bali',
  'Lombok (Rinjani)',
  'Labuan Bajo (Komodo)',
  'Gunungkidul (Jogja)',
  'Banyuwangi (Ijen)',
  'Derawan (Kaltim)',
  'Maros (Rammang-Rammang)'
] as const

export function useWishlistAlerts() {
  const watchedDestinations = useState<string[]>('jejaknusa-watched-destinations', () => [
    'Bali',
    'Labuan Bajo (Komodo)'
  ])

  function isWatched(destination: string): boolean {
    return watchedDestinations.value.includes(destination)
  }

  function toggleWatch(destination: string) {
    if (watchedDestinations.value.includes(destination)) {
      watchedDestinations.value = watchedDestinations.value.filter((d) => d !== destination)
    } else {
      watchedDestinations.value = [...watchedDestinations.value, destination]
    }
  }

  return {
    watchedDestinations,
    isWatched,
    toggleWatch
  }
}
