import React from 'react';
import PropTypes from 'prop-types';
// import { ReactComponent as Info } from '../../assets/img/info.svg';

const InfoIcon = ({ desc }) => {
	return (
		<div style={{ paddingBottom: '15px', position: 'relative',userSelect:'none' }}>
			{/* <Info style={{ width: '30px', height: '20px', position: 'absolute' }} /> */}
			<p style={{ marginTop: '2px', marginLeft: '30px' }}>{desc}</p>
		</div>
	);
};
/* eslint-disable react/forbid-prop-types */
InfoIcon.propTypes = {
	desc: PropTypes.any.isRequired,
};
/* eslint-enable react/forbid-prop-types */
export default InfoIcon;
