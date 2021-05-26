import { https, config } from 'firebase-functions'

import axios from 'axios' // API client
import express from 'express' // server
import cors from 'cors'

import crypto from 'crypto'

import cookieSession from 'cookie-session'

const app = express()

app.use(cors())

// set access and refresh tokens in cookie

app.use(cookieSession({
  name: 'spotify-session',
  keys: [config().keys.key1, config().keys.key2]
}))

const spotify = axios.create({
  baseURL: 'https://api.spotify.com/v1'
})

const auth = axios.create({
  baseURL: 'https://accounts.spotify.com'
})

app.use(async (req, res, next) => {
  if (req.session?.expires_at && Date.now() >= req.session.expires_at) {
    try {
      const result = await auth.post('/api/token', encodeURI(`grant_type=refresh_token&refresh_token=${req.session.refresh_token}`), {
        headers: {
          Authorization: `Basic ${Buffer.from(`${config().spotify.id}:${config().spotify.key}`).toString('base64')}`,
          'content-type': 'application/x-www-form-urlencoded'
        }
      })

      req.session.access_token = result.data.access_token
      req.session.expires_at = Date.now() + result.data.expires_in * 1000
    } catch (e) {
      console.error(e)
      if (e.response) {
        res.status(e.response.status)
        res.json(e.response.data)
      } else {
        res.status(500)
        res.end()
      }
    }
  }

  next()
})

app.get('/login', async (req, res) => {
  const state = req.session.state || crypto.randomBytes(20).toString('hex')
  req.session.state = state

  res.redirect(encodeURI(`${auth.defaults.baseURL}/authorize?client_id=${config().spotify.id}&response_type=code&redirect_uri=http://localhost:5001/mood-panda/us-central1/spotify/callback&state=${state}&scope=user-read-email user-read-recently-played&show_dialog=false`))
})

app.get('/callback', async (req, res) => {
  const code = req.query.code
  if (req.query.state !== req.session.state) {
    res.status(401)
    res.end()
    return
  }

  try {
    const result = await auth.post('/api/token', encodeURI(`grant_type=authorization_code&code=${code}&redirect_uri=http://localhost:5001/mood-panda/us-central1/spotify/callback`), {
      headers: {
        Authorization: `Basic ${Buffer.from(`${config().spotify.id}:${config().spotify.key}`).toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded'
      }
    })

    req.session.access_token = result.data.access_token
    req.session.refresh_token = result.data.refresh_token
    req.session.expires_at = Date.now() + result.data.expires_in * 1000

    res.json(result.data)
  } catch (e) {
    console.error(e)
    if (e.response) {
      res.status(e.response.status)
      res.json(e.response.data)
    } else {
      res.status(500)
      res.end()
    }
  }
})

app.get('/history', async (req, res) => {
  try {
    const recentlyPlayed = await spotify.get('/me/player/recently-played', {
      headers: {
        Authorization: `Bearer ${req.session.access_token}`
      }
    })

    const ids = recentlyPlayed.data.items.map(item => item.track.id)

    const audioFeatures = await spotify.get('/audio-features', {
      params: {
        ids: ids.join(',')
      },
      headers: {
        Authorization: `Bearer ${req.session.access_token}`
      }
    })

    res.json(audioFeatures.data.audio_features.map((e, i) => ({ id: ids[i], audio_features: e })))
  } catch (e) {
    console.error(e)
    if (e.response) {
      res.status(e.response.status)
      res.json(e.response.data)
    } else {
      res.status(500)
      res.end()
    }
  }
})

export default https.onRequest(app)
