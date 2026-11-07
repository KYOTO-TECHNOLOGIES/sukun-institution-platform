import React from 'react';
import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';
import { MultiSelect } from 'react-multi-select-component';
import FormGroup from '../bootstrap/forms/FormGroup';

const MultiSelectComponent = ({
	options,
	control,
	errors,
	setSelectedOptions,
	formLabel,
	selectedOptions,
	is_required,
}) => {
	const selectChange = (data) => {
		setSelectedOptions(data);
	};

	const valueRenderer = (selected) => {
		if (!selected.length) {
			return ' ';
		}
		const Names = selected.map((data) => data.label);

		if (selected.length > 10) {
			const displayedName = Names.slice(0, 10).join(', ');
			const remainingCount = Names.length - 10;
			const remainingText = ` (+${remainingCount} more)`;
			return `${displayedName}${remainingText}`;
		}
		return Names.length > 0 ? Names.join(', ') : '----';
	};

	return (
		<div className='col-12'>
			<FormGroup label={formLabel}>
				<Controller
					name={formLabel}
					control={control}
					rules={{
						required: is_required,
					}}
					render={({ field }) => (
						<MultiSelect
							options={options}
							value={selectedOptions}
							onChange={(value) => {
								selectChange(value);
								field.onChange(value);
							}}
							labelledBy='Select'
							// placeholder=''
							isCreatable={false}
							valueRenderer={valueRenderer}
						/>
					)}
				/>
				{errors[formLabel] && (
					<span style={{ color: 'red' }}>*This field is required'</span>
				)}
			</FormGroup>
		</div>
	);
};
/* eslint-disable react/forbid-prop-types */
MultiSelectComponent.propTypes = {
	options: PropTypes.array.isRequired,
	control: PropTypes.object.isRequired,
	errors: PropTypes.object.isRequired,
	setSelectedOptions: PropTypes.func.isRequired,
	formLabel: PropTypes.string.isRequired,
	selectedOptions: PropTypes.array.isRequired,
	is_required: PropTypes.bool.isRequired,
};
/* eslint-enable react/forbid-prop-types */

export default MultiSelectComponent;
