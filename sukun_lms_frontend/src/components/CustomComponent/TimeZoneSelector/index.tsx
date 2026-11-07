import React, { useEffect } from 'react';
import { FormGroup } from 'reactstrap';
import ReactSelectWithOnchangeComponent from '../Select/ReactSelectWithOnchangeComponent';
import { useForm } from 'react-hook-form';
import moment from 'moment-timezone';

interface TimeZoneSelectorProps {
  value?: string;
  onChange: (timezone: string) => void;
  label?: string;
  field_name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  options?: any;
}

// Generate timezone options dynamically using moment-timezone
const TIMEZONES = moment.tz.names().map((tz) => ({
  value: tz,
  label: `(GMT${moment.tz(tz).format('Z')}) ${tz}`,
}));

const TimeZoneSelector: React.FC<TimeZoneSelectorProps> = ({
  field_name,
  value,
  onChange,
  label = 'Time Zone',
  id = 'timezone-selector',
  required = false,
  disabled = false,
  placeholder = 'Select a timezone',
  className = '',
}) => {
  const {
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      timezone: value ? { value, label: value } : null,
    },
  });

  // Sync external value → form value
  useEffect(() => {
    if (value) {
      setValue('timezone', { value, label: value });
    }
  }, [value, setValue]);

  return (
    <FormGroup className={className}>
    
      <ReactSelectWithOnchangeComponent
        control={control}
        name={label}
        options={TIMEZONES}
        isRequired={required}
        field_name={field_name}
        getValues={getValues}
        errors={errors}
        isDisable={disabled}
        placeholder={placeholder}
        onChangeFunction={(val: any) => onChange(val?.value)}
      />
    </FormGroup>
  );
};

export default TimeZoneSelector;
