import React from 'react'
import FilterListIcon from '@mui/icons-material/FilterList';

const TimeFilter = ({onFilterChanged,tableData,columnDef}:any) => {
  return (
    <div style={{position:"relative"}} >
        <FilterListIcon style={{position:'absolute',left:'10px',top:'15px' }}/>
      <input
            placeholder="custom"
            style={{height:"50px",width:'120px',paddingLeft:"40px"}}
            type='time'
            onChange={(e) => {
            // Calling the onFilterChanged with the current tableId and the new value
            onFilterChanged(columnDef.tableData.id, e.target.value);
            }}
        />
    </div>
  )
}

export default TimeFilter
