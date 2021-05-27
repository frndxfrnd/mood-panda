import { https, config } from 'firebase-functions'

import axios from 'axios'
import express from 'express'

import crypto from 'crypto'

import cookieSession from 'cookie-session'

const auth = axios.create({
  baseURL: 'https://accounts.spotify.com'
})

const app = express()

// cookie session
app.use(cookieSession({
  name: 'spotify-session',
  keys: [config().keys.key1, config().keys.key2]
}))

const refresh = (session) => auth.post('/api/token', encodeURI(`grant_type=refresh_token&refresh_token=${session.refresh_token}`), {
  headers: {
    Authorization: `Basic ${Buffer.from(`${config().spotify.id}:${config().spotify.key}`).toString('base64')}`,
    'content-type': 'application/x-www-form-urlencoded'
  }
}).then(({ data }) => {
  session.access_token = data.access_token
  session.expires_at = Date.now() + data.expires_in * 1000
})

// spotify client
app.use((req, res, next) => {
  const client = axios.create({
    baseURL: 'https://api.spotify.com/v1'
  })

  client.interceptors.request.use(async (config) => {
    if (Date.now() >= req.session.expires_at) {
      await refresh(req.session)
    }
    config.headers.Authorization = `Bearer ${req.session.access_token}`
    return config
  })

  client.interceptors.response.use(null, async (err) => {
    switch (err.response?.data?.error) {
      case 'invalid_token':
        await refresh(req.session)
        return await client(err.config)
      default:
        req.session = undefined
        throw err
    }
  })

  req.spotify = client

  next()
})

app.get('/login', async (req, res) => {
  const state = req.session.state ?? crypto.randomBytes(20).toString('hex')
  req.session.state = state
  res.redirect(encodeURI(`${auth.defaults.baseURL}/authorize?client_id=${config().spotify.id}&response_type=code&redirect_uri=http://localhost:5001/mood-panda/us-central1/spotify/callback&state=${state}&scope=user-read-email user-read-recently-played&show_dialog=false`))
})

app.get('/callback', async (req, res) => {
  // check state
  if (req.query.state !== req.session.state) {
    console.error(req.query.state, req.session.state)
    res.status(401)
    res.json({
      error: 'invalid-state',
      message: 'Invalid state.'
    })
    return
  }

  // in case of error
  if (req.query.error) {
    res.status(401)
    res.send(req.query.error)

    return
  }

  try {
    const result = await auth.post('/api/token', encodeURI(`grant_type=authorization_code&code=${req.query.code}&redirect_uri=http://localhost:5001/mood-panda/us-central1/spotify/callback`), {
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
    if (e.response) {
      res.status(e.response.status)
      res.json(e.response.data)
    } else {
      throw e
    }
  }
})

app.get('/history', async (req, res) => {
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

export default https.onRequest(app)
