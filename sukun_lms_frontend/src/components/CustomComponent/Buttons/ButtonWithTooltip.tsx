import React from 'react'
import { Tooltip } from '@mui/material';
import Button from '../../bootstrap/Button';

const  ButtonWithTooltip= ({onClick,name,icon,color,isLight,isOutline,width,size,TooltipTitle,placement}:any) => {
  
  return (
   <Tooltip arrow title={TooltipTitle} placement={placement}>
     <Button
        color={color}
        isLight={isLight}
        icon={icon}
        onClick={onClick}
        isOutline={isOutline}
        style={{width:width||''}}
        size={size||''}
        
        > 
      {name}
   </Button>
   </Tooltip>
  )
}

export default ButtonWithTooltip
