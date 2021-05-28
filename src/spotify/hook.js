import axios from 'axios'
import { makeUseAxios } from 'axios-hooks'

export default makeUseAxios({
  axios: axios.create({ baseURL: 'northamerica-northeast1-mood-panda.cloudfunctions.net/spotify' })
})
