import React from 'react'
import Icon from '../icon/Icon'

const InspectionIcon = ({icon,title,value}:any) => {
  return (
   <div className='d-flex gap-3 mb-3'>
      <Icon icon={icon}  size='4x' />
      <div>
      <h5 style={{fontWeight:600}} className='mb-0 mt-2'>{title}</h5>
       <p>{value||''}</p>
      </div>
    </div>
  )
}

export default InspectionIcon
