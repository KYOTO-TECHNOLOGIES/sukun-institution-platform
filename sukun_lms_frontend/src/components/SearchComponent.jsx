import React from 'react';
import PropTypes from 'prop-types';
import { Input } from 'reactstrap';
import Icon from './icon/Icon';

const SearchComponent = ({
	handleChange,
	value,
	placeholder,
	className,
	inputClassName,
	iconColor,
	iconSize,
	withDefaultMargin,
	onKeyDown,
	onBlur,
}) => {
	return (
		<div
			className={`d-flex ${withDefaultMargin ? 'me-4' : ''} ${className || ''}`.trim()}
			data-tour='search'>
			{/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
			<label className='border-0 bg-transparent cursor-pointer mb-0 d-flex align-items-center'>
				<Icon icon='Search' size={iconSize} color={iconColor} />
			</label>
			<Input
				id='searchInput'
				type='search'
				className={`border-0 shadow-none bg-transparent ${inputClassName || ''}`.trim()}
				placeholder={placeholder}
				value={value}
				onChange={(e) => handleChange(e.target.value)}
				onKeyDown={onKeyDown}
				onBlur={onBlur}
				autoComplete='off'
			/>
		</div>
	);
};
/* eslint-disable react/forbid-prop-types */
SearchComponent.propTypes = {
	handleChange: PropTypes.func.isRequired,
	value: PropTypes.string,
	placeholder: PropTypes.string,
	className: PropTypes.string,
	inputClassName: PropTypes.string,
	iconColor: PropTypes.string,
	iconSize: PropTypes.string,
	withDefaultMargin: PropTypes.bool,
	onKeyDown: PropTypes.func,
	onBlur: PropTypes.func,
};
/* eslint-enable react/forbid-prop-types */
SearchComponent.defaultProps = {
	value: '',
	placeholder: 'Search...',
	className: '',
	inputClassName: '',
	iconColor: 'secondary',
	iconSize: '2x',
	withDefaultMargin: true,
	onKeyDown: undefined,
	onBlur: undefined,
};
export default SearchComponent;
