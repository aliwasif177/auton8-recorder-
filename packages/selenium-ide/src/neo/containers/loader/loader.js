import React from 'react'
import Loader from 'react-loader-spinner'

export const TailLoader = props => {
  return <Loader height={props.height} width={props.width} type="TailSpin" />
}
