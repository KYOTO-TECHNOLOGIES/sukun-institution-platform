import React from 'react'
import Button from '../bootstrap/Button'

const CloseButtton = ({onClick}:any) => {
  return (
    <Button color='danger' className='me-2' onClick={onClick}>
    Close
   </Button>
  )
}

export default CloseButtton
