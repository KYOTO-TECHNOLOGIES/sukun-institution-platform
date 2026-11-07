import React from 'react'
import { useNavigate } from 'react-router-dom';
import Button from '../../bootstrap/Button'

const BackButton = () => {
    const navigate = useNavigate();
  return (
    <Button color='secondary' isLink icon='ArrowBack' onClick={() => navigate(-1)}>
    Back
</Button>
  )
}

export default BackButton
