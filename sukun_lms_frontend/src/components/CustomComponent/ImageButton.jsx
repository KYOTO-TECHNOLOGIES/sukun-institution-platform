import React from 'react';
import PropTypes from 'prop-types';
// import { ReactComponent as EvacuationIcon } from '../../assets/img/EvacuationPoint.svg';

const CustomImageButton = ({ onClick, isActive }) => {
	return (
		<button
			className='styled-image-button'
			type='button'
			style={{ background: isActive && ' #4D69FA', color: isActive && 'white' }}
			onClick={() => onClick()}>
			{/* <EvacuationIcon
				className='styled-image-button-icon'
				style={{ fill: isActive && 'white', color: '#4D69FA' }}
			/> */}
			Evacuation points
		</button>
	);
};
/* eslint-disable react/forbid-prop-types */
CustomImageButton.propTypes = {
	onClick: PropTypes.any.isRequired,
	isActive: PropTypes.any.isRequired,
};
/* eslint-enable react/forbid-prop-types */
export default CustomImageButton;
