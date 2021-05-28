import { https } from 'firebase-functions'

import express from 'express'

import authRouter from './auth'
import historyRouter from './history'

const app = express()

app.use('/', [authRouter, historyRouter])

export default https.onRequest(app)
