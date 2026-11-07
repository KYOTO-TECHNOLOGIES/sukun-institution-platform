import React from 'react'
import { Spinner } from 'reactstrap'
import Button from '../../bootstrap/Button'

const SaveIconButton = ({waitingForAxios,isLoading,onClickfunc,isOutline=false}:any) => {
  return (
    <Button
        icon={waitingForAxios?"":'Save'}
        color='primary'
        isOutline={isOutline}
        className='w-100'
        isDisable={waitingForAxios||isLoading}
        onClick={onClickfunc}

        >
        {waitingForAxios?<Spinner size="sm"/>:"Save"}
    </Button>
  )
}

export default SaveIconButton
