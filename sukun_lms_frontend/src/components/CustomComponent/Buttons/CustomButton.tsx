import React from 'react'
import { Spinner } from 'reactstrap';
import Button from '../../bootstrap/Button';

const CustomButton = ({onClick,name,icon,color,isLight,isOutline,width,size,loading}:any) => {
  
  return (
    <Button
        color={color}
        isLight={isLight}
        icon={icon}
        onClick={onClick}
        isOutline={isOutline}
        style={{width:width||''}}
        size={size||''}
        isDisable={loading}
        > 
     {loading?<Spinner animation="grow" size="sm" />:name}

   </Button>
  )
}

export default CustomButton
