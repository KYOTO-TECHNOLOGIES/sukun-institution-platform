import React from 'react'
import ReactInputMask from 'react-input-mask';
import { Controller } from 'react-hook-form';
import FormGroup from '../../bootstrap/forms/FormGroup';

const InputComponentForIP = ({control,errors}:any) => {

  const ipv4Regex =/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  const validateIP = (value: string) => {
    let temp = value.replace(/_/g, "").trim(); // Remove underscores

    if (temp.includes("_")) {
      return "Please provide a complete IP Address";
    }

    if (ipv4Regex.test(temp) || ipv6Regex.test(temp)) {
      return true;
    }

    return "Invalid IP Address";
  };

  return (
    <div className='mb-3'>
        <FormGroup label="IP Address *">
            <Controller
                name='ip_address'
                control={control}
                rules={{ validate: validateIP }}
                render={({ field }:any) => (
                    <>
                    <ReactInputMask
                        {...field}
                        mask="999.999.999.999"
                        className="form-control"
                        
                    />
                    {errors?.ip_address && (
                        <span style={{ color: 'red' }}>{errors.ip_address.message}</span>
                    )}
                    </>
                )}
            />
        </FormGroup>
    </div>	
  )
}

export default InputComponentForIP
