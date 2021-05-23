import '@compiled/react'
import 'twin.macro'

import { useRef, useEffect } from 'react'

export default (props) => {
  const canvas = useRef(null)

  useEffect(() => {
    const ctx = canvas.current.getContext('2d')

    ctx.fillStyle = 'blue'
    ctx.fillRect(0, 0, canvas.current.width, canvas.current.height)
  }, [canvas])

  return (
    <canvas
      {...props}
      ref={canvas}
    />
  )
}
