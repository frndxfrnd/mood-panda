import { useRef, useEffect } from 'react'

import Canvas from './canvas'

export default () => {
  const canvas = useRef(null)

  useEffect(() => {
    const { current } = canvas

    /* const ctx = */ current.getContext('2d')
  }, [canvas])

  return (
    <div>
      <Canvas />
    </div>
  )
}
