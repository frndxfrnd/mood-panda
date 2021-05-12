import axios from 'axios'
import { makeUseAxios } from 'axios-hooks'

export default makeUseAxios({
  axios: axios.create({ baseURL: 'https://api.spotify.com/v1/' })
})
