import { defineEventHandler } from 'h3'
import { platformFeaturesStore } from '../../utils/platformStore'

export default defineEventHandler(() => {
  return {
    features: platformFeaturesStore
  }
})
