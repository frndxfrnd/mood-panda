import { useRef, useEffect } from 'react'

export default () => {
  const container = useRef(null)
  const canvas = useRef(null)

  useEffect(() => {
    const { current } = canvas

    /* temporary side effect */ console.log(current)
  }, [canvas])

  return (
    <div ref={container}>
      <canvas ref={canvas} />
    </div>
  )
}
