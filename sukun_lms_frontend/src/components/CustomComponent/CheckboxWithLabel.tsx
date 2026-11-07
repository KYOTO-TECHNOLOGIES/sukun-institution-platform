import React from 'react'
import { Controller } from 'react-hook-form';
import { Input as Checkbox } from 'reactstrap';


const CheckboxWithLabel = ({control,watch,name,label ,size}:any) => {
   const checked=watch(name)
  return (
    <div className=' d-flex gap-2 mt-4 mb-4'>
    <Controller
        name={name}
        control={control}
        rules={{
            required:false,
        }}
        render={({ field }:any) => (
         <Checkbox
            type='switch'         
            id={name}
            checked={checked}
            onChange={(e:any) => {
                field.onChange(e.target.checked);
            }}
            style={{
                width:size,
                height:size,
                cursor: 'pointer',
                color: '#fff',
            }}
       />
    )}
/>
<label
    className='mt-1'
    style={{ fontWeight: 450, color: '#6C757D',cursor:'pointer' ,userSelect:'none'}}
    htmlFor={name}>
    {label}
</label>
</div>
  )
}

export default CheckboxWithLabel
