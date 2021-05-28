import { config } from 'firebase-functions'
import { Router } from 'express'

import cookieSession from 'cookie-session'
import axios from 'axios'
import crypto from 'crypto'

const auth = axios.create({
  baseURL: 'https://accounts.spotify.com'
})

const refresh = (session) => auth.post('/api/token', encodeURI(`grant_type=refresh_token&refresh_token=${session.refresh_token}`), {
  headers: {
    Authorization: `Basic ${Buffer.from(`${config().spotify.id}:${config().spotify.key}`).toString('base64')}`,
    'content-type': 'application/x-www-form-urlencoded'
  }
}).then(({ data }) => {
  session.access_token = data.access_token
  session.expires_at = Date.now() + data.expires_in * 1000
})

const router = Router()

const func = process.env.FUNCTIONS_EMULATOR ? 'http://127.0.0.1:5001/mood-panda/us-central1/spotify' : 'https://us-central1-mood-panda.cloudfunctions.net/spotify'
const hosting = process.env.FUNCTIONS_EMULATOR ? 'http://127.0.0.1:5000/' : 'https://mood-panda.web.app'

// cookie session
router.use(cookieSession({
  name: 'session',
  keys: [config().keys.key1, config().keys.key2]
}))

// spotify client
router.use((req, res, next) => {
  console.debug('autorefresh on')

  const client = axios.create({
    baseURL: 'https://api.spotify.com/v1'
  })

  client.interceptors.request.use(
    async (config) => {
      if (Date.now() >= req.session.expires_at) {
        console.debug('access token expired, refreshing')
        await refresh(req.session)
        console.debug('access token refreshed')
      }
      config.headers.Authorization = `Bearer ${req.session.access_token}`
      return config
    },
    async (error) => {
      console.error('refresh failed')
      throw error
    }
  )

  client.interceptors.response.use(undefined, async (err) => {
    switch (err.response?.data?.error) {
      case 'invalid_token':
        try {
          console.debug('access token expired, refreshing')
          await refresh(req.session)
          console.debug('access token refreshed')
          return await client(err.config)
        } catch (e) {
          req.session = null
          console.error('refresh failed')
          throw e
        }
      default:
        req.session = null
        throw err
    }
  })

  req.spotify = client

  return next()
})

router.get('/login', async (req, res) => {
  const state = crypto.randomBytes(20).toString('hex')
  const redirect = req.query.redirect ?? hosting
  console.debug(`login with state [${state}]: ${redirect}`)
  req.session.state = {
    [state]: redirect
  }
  const url = encodeURI(`${auth.defaults.baseURL}/authorize?client_id=${config().spotify.id}&response_type=code&redirect_uri=${func}/callback&state=${state}&scope=user-read-email user-read-recently-played&show_dialog=false`)
  res.format({
    json: () => res.json({ url }),
    html: () => res.redirect(url),
    text: () => res.send(url)
  })
})

router.get('/callback', async (req, res) => {
  // check state
  const state = req.session.state
  if (!state) {
    console.error('callback with no state')
    res.status(401)
    res.json({
      error: 'no-state',
      message: 'No state.'
    })
    return
  }

  const redirect = state[req.query.state.toString()]
  if (!redirect) {
    console.error('callback with invalid state', req.session.state)
    res.status(401)
    res.json({
      error: 'invalid-state',
      message: 'Invalid state.'
    })
    return
  }

  // in case of error
  if (req.query.error) {
    console.error('callback with error', req.query.error)
    res.status(401)
    res.send(req.query.error)
    return
  }

  try {
    console.debug('callback get token')
    const result = await auth.post('/api/token', encodeURI(`grant_type=authorization_code&code=${req.query.code}&redirect_uri=${func}/callback`), {
      headers: {
        Authorization: `Basic ${Buffer.from(`${config().spotify.id}:${config().spotify.key}`).toString('base64')}`,
        'content-type': 'application/x-www-form-urlencoded'
      }
    })

    const expiresAt = Date.now() + result.data.expires_in * 1000

    console.debug('callback got token, expires at', new Date(expiresAt).toISOString())

    req.session = {
      access_token: result.data.access_token,
      refresh_token: result.data.refresh_token,
      expires_at: expiresAt
    }

    console.debug('callback redirecting to', redirect)

    res.format({
      json: () => res.json({ url: redirect }),
      html: () => res.redirect(redirect),
      text: () => res.send(redirect)
    })

    console.log(res)
  } catch (e) {
    if (e.response) {
      console.error('callback get token failed', e.response.status, e.response.data)
      res.status(e.response.status)
      res.json(e.response.data)
    } else {
      res.status(500)
      throw e
    }
  }
})

export default router
