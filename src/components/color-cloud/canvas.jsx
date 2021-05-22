import { useRef, useEffect } from 'react'

export default () => {
  const canvas = useRef(null)

  useEffect(() => {
    const { current } = canvas

    /* temporary side effect */ console.log(current)
  }, [canvas])

  return (
    <canvas
      ref={canvas}
    />
  )
}
