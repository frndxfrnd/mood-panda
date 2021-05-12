import { https } from 'firebase-functions'

import axios from 'axios' // API client
import express from 'express' // server
import cors from 'cors'

const app = express()
app.use(cors())

const spotify = axios.create({
  baseURL: 'https://api.spotify.com/v1'
})

app.get('/', async (req, res) => {
  res.json({
    url: spotify.defaults.baseURL
  })
})

export default https.onRequest(app)
