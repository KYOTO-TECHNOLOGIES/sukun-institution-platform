import React from 'react'
import Button from '../../bootstrap/Button';
import useDarkMode from '../../../hooks/useDarkMode';
import { useNavigate } from 'react-router-dom';

const AddButtonWthNavigate = ({ name, icon, link }: any) => {
  const { darkModeStatus } = useDarkMode();
  const navigate = useNavigate();
  return (
    <Button
      color={darkModeStatus ? 'light' : 'primary'}
      isLight
      icon={icon ? icon : 'Add'}
      onClick={() => {
        navigate(link);
      }}
    >
      {name}
    </Button>
  )
}

export default AddButtonWthNavigate
