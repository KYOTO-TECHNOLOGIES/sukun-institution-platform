import React from 'react';
import FormGroup from '../../bootstrap/forms/FormGroup';

interface ContactNumberFieldProps {
  label: string;
  field_name: string;
  required?: boolean;
  register: any;
  errors: any;
  maxLength?: number;
  isFloating:boolean;
}

const ContactNumberField: React.FC<ContactNumberFieldProps> = ({
  label,
  field_name,
  required = false,
  register,
  errors,
  isFloating,
  maxLength = 15,
}) => {
  return (
    <FormGroup label={label} isFloating={isFloating}>
      <input
        type='text'
        {...register(field_name, { required })}
        className='form-control'
        placeholder='Contact Number'
        onKeyDown={(evt) => {
          const invalidKeys = ['e', 'E', '+', '-', '=', '.','{','}','[',']',':',';','!','@','#','$','%','^','&','*','_','|','\\','<','>','?'];
          if (invalidKeys.includes(evt.key) || evt.key === 'ArrowDown') {
            evt.preventDefault();
          }
        }}
        //@ts-ignore
        maxLength={maxLength}
        onInput={(e:any) => {
            const input = e.target 
            input.value = input.value.replace(/[^0-9()+]/g, '');
        }}
      />
      {required && errors[field_name]?.type === 'required' ? (
        <span style={{ color: '#F35421' }}>*This field is required</span>
      ) : (
        <p />
      )}
    </FormGroup>
  );
};

export default ContactNumberField;
