import React from 'react'
import Button from '../../bootstrap/Button';
import useDarkMode from '../../../hooks/useDarkMode';

const EditButton = ({modalShow,id}:any) => {
  const { darkModeStatus } = useDarkMode();
  return (
    <Button
        color={darkModeStatus ? 'light' : 'dark'}
        isLight
        icon='Edit'
        size='sm'
        onClick={(e:any) => {
          modalShow(id);
          e.stopPropagation();
        }}
        style={{borderRadius:"10px"}}
        > 
        Edit
   </Button>
  )
}

export default EditButton
