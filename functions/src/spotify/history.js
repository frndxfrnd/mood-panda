import { Router } from 'express'

const router = Router()

router.get('/history', async (req, res) => {
  try {
    const recentlyPlayed = await req.spotify.get('/me/player/recently-played')

    const ids = recentlyPlayed.data.items.map(item => item.track.id)

    const audioFeatures = await req.spotify.get('/audio-features', {
      params: {
        ids: ids.join(',')
      }
    })

    res.json(audioFeatures.data.audio_features.map((e, i) => ({ id: ids[i], audio_features: e })))
  } catch (e) {
    if (e.response) {
      res.status(e.response.status)
      res.json(e.response.data)
    } else {
      throw e
    }
  }
})

export default router
