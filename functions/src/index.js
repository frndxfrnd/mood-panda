import 'firebase-functions/lib/logger/compat'
import { initializeApp } from 'firebase-admin'
initializeApp()

export { default as spotify } from './spotify'
