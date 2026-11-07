import React from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import PropTypes from 'prop-types';

const NoDataComponent = ({ lottie, description, className = '' }) => {
	return (
		<div className={`no-data-component ${className}`.trim()}>
			<Player
				autoplay
				loop
				src={lottie}
				renderer='svg'
				style={{ width: 360, height: 220, maxWidth: '100%' }}
			/>
			<p className='no-data-component__text'>{description}</p>
		</div>
	);
};

/* eslint-disable react/forbid-prop-types */
NoDataComponent.propTypes = {
	lottie: PropTypes.any.isRequired,
	description: PropTypes.string.isRequired,
	className: PropTypes.string,
};
/* eslint-enable react/forbid-prop-types */

export default NoDataComponent;
