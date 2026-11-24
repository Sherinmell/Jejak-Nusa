import { defineEventHandler, getQuery } from 'h3'
import { tripLobbyMessagesStore } from '../../utils/platformStore'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const tripSlug = typeof query.tripSlug === 'string' ? query.tripSlug.trim() : ''

  const messages = tripSlug
    ? tripLobbyMessagesStore.filter((m) => m.tripSlug === tripSlug)
    : tripLobbyMessagesStore

  return { messages }
})
