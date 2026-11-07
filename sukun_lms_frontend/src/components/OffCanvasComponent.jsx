import React from 'react';
import PropTypes from 'prop-types';
import OffCanvas, { OffCanvasBody, OffCanvasHeader, OffCanvasTitle } from './bootstrap/OffCanvas';

const OffCanvasComponent = (props) => {
	const { isOpen, setOpen, placement, title, children } = props;
	return (
		<OffCanvas isOpen={isOpen} setOpen={setOpen} placement={placement || 'end'}>
			<OffCanvasHeader setOpen={setOpen}>
				<OffCanvasTitle id='offcanvas_title'>{title}</OffCanvasTitle>
			</OffCanvasHeader>
			<OffCanvasBody>{children}</OffCanvasBody>
		</OffCanvas>
	);
};
/* eslint-disable react/forbid-prop-types */
OffCanvasComponent.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	setOpen: PropTypes.func.isRequired,
	placement: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
	children: PropTypes.node.isRequired,
};
/* eslint-enable react/forbid-prop-types */
export default OffCanvasComponent;
