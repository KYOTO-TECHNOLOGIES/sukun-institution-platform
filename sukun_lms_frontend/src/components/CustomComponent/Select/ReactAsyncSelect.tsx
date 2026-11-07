import React from 'react';
import AsyncSelect from 'react-select/async';
import FormGroup from '../../bootstrap/forms/FormGroup';
import { Controller } from 'react-hook-form';
import useSelectStyles from '../../../hooks/useSelectStyle';

const ReactAsyncSelect = ({
  control,
  name,
  field_name,
  getValues,
  errors,
  promiseOptions,
  isRequired,
}:any) => {
  const reactSelectStyle = useSelectStyles();

  return (
    <FormGroup label={name}>
      <Controller
        name={field_name}
        control={control}
        rules={{
          required: isRequired,
        }}
        render={({ field }) => (
          <>
            <AsyncSelect
              placeholder="Select.."
              onChange={(values) => {
                field.onChange(values);
              }}
              isClearable={false}
              styles={reactSelectStyle}
              value={getValues(field_name)}
              cacheOptions
              loadOptions={promiseOptions}
              defaultOptions
            />
          </>
        )}
      />
      {/* Safely check for validation errors */}
      {errors[field_name]?.type === 'required' ? (
        <span style={{ color: 'red' }}>*This field is required</span>
      ) : (
        <p />
      )}
    </FormGroup>
  );
};

export default ReactAsyncSelect;
