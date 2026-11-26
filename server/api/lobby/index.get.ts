import { defineEventHandler, getQuery } from 'h3'
import { loadLobbyMessages } from '../../utils/runtimePersistence'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const tripSlug = typeof query.tripSlug === 'string' ? query.tripSlug.trim() : ''
  const allMessages = await loadLobbyMessages()

  const messages = tripSlug
    ? allMessages.filter((m) => m.tripSlug === tripSlug)
    : allMessages

  return { messages }
})
