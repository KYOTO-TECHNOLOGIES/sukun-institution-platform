import React, { FC } from 'react'
// import FormGroup from '../bootstrap/forms/FormGroup';
// import Input from '../bootstrap/forms/Input';
import AnimatedInputs from '../../CustomComponent/Fields/AnimatedInputs';

interface ConfirmPasswordPropType{
  formik:any
  isReset:boolean
}

const ConfirmPassword:FC<ConfirmPasswordPropType> = ({formik,isReset=false}) => {

  // const {values,touched,errors,isValid,handleChange,handleBlur} = formik
  return (
    <>
      <div className='text-center h3 fw-bold mt-3'>{isReset?'Change Password':'Forgot Password'}</div>
        <div className='text-center h5 text-muted mb-4 mt-1'>Create new password !</div>
    <div className='col-12'>
       
        {/* <FormGroup id='newPassword' isFloating label='New Password'>
            <Input
                type='password'
                autoComplete='new-password'
                value={values.newPassword}
                isTouched={touched.newPassword}
                invalidFeedback={errors.newPassword}
                isValid={isValid}
                onChange={handleChange}
                onBlur={handleBlur}
            />
        </FormGroup>
        <FormGroup
            id='confirmPassword'
            isFloating
            label='Confirm Password'
            className='mt-4'>
            <Input
                type='password'
                autoComplete='new-password'
                value={values.confirmPassword}
                isTouched={touched.confirmPassword}
                invalidFeedback={errors.confirmPassword}
                isValid={isValid}
                onChange={handleChange}
                onBlur={handleBlur}
            />
        </FormGroup> */}



         <AnimatedInputs
              fields={[
                { label: "New Password", name: "newPassword" },
                { label: 'Confirm Password', name: "confirmPassword" }
              ]}
              formik={formik}
             
              />
    </div>
   
    </>
  )
}
export default ConfirmPassword