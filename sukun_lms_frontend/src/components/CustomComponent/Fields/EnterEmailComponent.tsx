import React, { FC } from 'react';
import { motion } from 'framer-motion';
import FormGroup from '../../bootstrap/forms/FormGroup';
import Input from '../../bootstrap/forms/Input';

interface EnterEmailComponentPropType {
  formik: any;
}

const EnterEmailComponent: FC<EnterEmailComponentPropType> = ({ formik }) => {
  const {
    values,
    touched,
    errors,
    isValid,
    handleChange,
    handleBlur,
    setErrors,
    setFieldValue,
  } = formik;

  const handleUsername = ({ target: { value } }: any) => {
    const trimmedValue = value.replace(/\s+/g, ''); // Remove spaces from the input
    setFieldValue('email', trimmedValue);
  };

  return (
 <>
      <div className='text-center h3 fw-bold mt-3'>Forgot Password</div>
      <div className='text-center h5 text-muted mb-5 mt-2'>
        Enter your registered email ID!
      </div>

      <div className='col-12'>
        <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        >
        <FormGroup id='email' isFloating label='Email Address'>
          <Input
            autoComplete='username'
            value={values.email}
            isTouched={touched.email}
            invalidFeedback={errors.email}
            isValid={isValid}
            onChange={(e) => {
              handleChange(e); // Update Formik state
              handleUsername(e); // Remove whitespace
            }}
            onBlur={handleBlur}
            onFocus={() => {
              setErrors({});
            }}
          />
        </FormGroup>
        </motion.div>
        <br />
      </div>
      </>
  );
};

export default EnterEmailComponent;