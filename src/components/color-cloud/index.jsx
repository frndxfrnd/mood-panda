import { useRef, useEffect } from 'react'

import Canvas from './canvas'

export default () => {
  const canvas = useRef(null)

  useEffect(() => {
    const { current } = canvas

    /* temporary side effect */ console.log(current)
  }, [canvas])

  return (
    <div>
      <Canvas />
    </div>
  )
}
