import { useState } from 'react';
import FormGroup from '../../bootstrap/forms/FormGroup';
import Icon from '../../icon/Icon';

 const PasswordField = ({ register, errors ,field_name}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className='col-12'>
      <FormGroup label="Key *" className="position-relative">
        <input
          type='text'
          className={`form-control pe-5 ${!showPassword&&'masked-input-password'}`}
          {...register(field_name, { required: true })}
        />
        <span
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: 'absolute',
            top: '45px',
            right: '10px',
            transform: 'translateY(-50%)',
            cursor: 'pointer',
          }}
        >
         <Icon size='lg' icon={showPassword?'VisibilityOff':'Visibility'}/>
        </span>
        {errors[field_name]?.type === "required" ? (
          <span style={{ color: 'red' }}>*This field is required</span>
        ) : <p />}
      </FormGroup>
    </div>
  );
};

export default PasswordField;