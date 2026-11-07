import { Tooltip } from '@mui/material';
import React from 'react'
import { useNavigate } from 'react-router-dom';

const NameNavigateComponent = ({navigation ,field,  placement='right',title,checked=false}:any) => {
    const navigate = useNavigate();
    if(checked){
      return  field
    }

  return (
    <Tooltip arrow title={title||`View ${field} details`} placement={placement}>
    <div
        style={{fontWeight:600,minWidth:"30px",paddingTop:'10px'}}
        onClick={() => navigate(navigation)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') navigate(navigation);
        }}
      >
       <p>{field}</p>
      </div>
    </Tooltip>
  )
}

export default NameNavigateComponent
