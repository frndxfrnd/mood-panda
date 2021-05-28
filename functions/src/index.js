import 'firebase-functions/lib/logger/compat'
import admin from 'firebase-admin'
admin.initializeApp()

export { default as spotify } from './spotify'
