import React from 'react';
import PropTypes from 'prop-types';
import FormGroup from '../bootstrap/forms/FormGroup';

const StartDateAndEndDateField = ({
	register,
	errors,
	watch,
	setValue,
	startDate,
	endDate,
	startDateLabel,
	endDateLabel,
	is_StartDateRequired=false,
	is_EndDateRequired=false,
	isDisable=false
}) => {
	const startDates = watch(startDate);
	// const event_max_date = watch('max_end-date');
	return (
		<div className='row mb-3'>
			<div className='col-6'>
				<FormGroup label={is_StartDateRequired ? `${startDateLabel} *` : startDateLabel}>
					<input
						type='date'
						// min={new Date().toISOString().split('T')[0]}
						{...register(startDate, {
							required: is_StartDateRequired,
							onChange: () => {
								setValue(endDate, '');
							},
						})}
						className='form-control'
						style={{ height: '40px' }}
						onKeyDown={(e) => e.preventDefault()}
						disabled={isDisable}
					/>
					{errors[startDate]?.type && (
						<span style={{ color: 'red' }}>*This field is required</span>
					)}
				</FormGroup>
			</div>
			<div className='col-6'>
				<FormGroup label={is_EndDateRequired ? `${endDateLabel} *` : endDateLabel}>
					<input
						type='date'
						{...register(endDate, {
							required: is_EndDateRequired,
						})}
						min={startDates}
						// max={event_max_date}
						className='form-control'
						style={{ height: '40px' }}
						onKeyDown={(e) => e.preventDefault()}
						disabled={isDisable}
					/>
					{errors[endDate]?.type && (
						<span style={{ color: 'red' }}>*This field is required</span>
					)}
				</FormGroup>
			</div>
		</div>
	);
};
/* eslint-disable react/forbid-prop-types */
StartDateAndEndDateField.propTypes = {
	watch: PropTypes.any.isRequired,
	setValue: PropTypes.func.isRequired,
	register: PropTypes.func.isRequired,
	errors: PropTypes.object.isRequired,
	startDate: PropTypes.string.isRequired,
	endDate: PropTypes.string.isRequired,
	startDateLabel: PropTypes.string.isRequired,
	endDateLabel: PropTypes.string.isRequired,
	is_EndDateRequired: PropTypes.bool.isRequired,
	is_StartDateRequired: PropTypes.bool.isRequired,
	isDisable: PropTypes.bool.isRequired,

	
};
/* eslint-enable react/forbid-prop-types */
export default StartDateAndEndDateField;
