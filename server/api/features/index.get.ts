import { defineEventHandler } from 'h3'
import { loadPlatformFeatures } from '../../utils/runtimePersistence'

export default defineEventHandler(async () => {
  const features = await loadPlatformFeatures()
  return { features }
})
