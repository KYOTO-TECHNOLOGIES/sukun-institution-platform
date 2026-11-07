import React from 'react'
import { Input as Checkbox } from 'reactstrap';

const CheckboxOfDeletedData = ({setChecked,checked,tableRef,id,labelText}:any) => {
  return (
    <div className=' d-flex gap-2'>
							<Checkbox
								type='switch'
								required
								id={id}
								checked={checked}
								onChange={(e:any) => {
									setChecked(e.target.checked)
									tableRef.current.onQueryChange();

								}}
								style={{
									width: '20px',
									height: '20px',
									cursor: 'pointer',
									color: '#fff',
								}}
							/>
							<label
								className='mt-1'
								style={{ fontWeight: 450, color: '#6C757D',cursor:'pointer' ,userSelect:'none'}}
								htmlFor={id}>
								{labelText}
							</label>
					</div>
  )
}

export default CheckboxOfDeletedData
