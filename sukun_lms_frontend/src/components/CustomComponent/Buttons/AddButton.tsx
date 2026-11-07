import React from 'react'
import Button from '../../bootstrap/Button';
import useDarkMode from '../../../hooks/useDarkMode';

const AddButton = ({modalShow,name ,icon}:any) => {
  const { darkModeStatus } = useDarkMode();
  return (
    <Button
        color={darkModeStatus ? 'light' : 'primary'}
        isLight
        icon={icon?icon:'Add'}
        onClick={() => {
            modalShow(true);
        }}
        > 
      {name}
   </Button>
  )
}

export default AddButton
