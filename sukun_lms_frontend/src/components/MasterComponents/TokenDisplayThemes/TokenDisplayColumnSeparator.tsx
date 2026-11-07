import React from 'react';

/** Fill-layout column split — static track + trace sweep (styled per theme in SCSS). */
const TokenDisplayColumnSeparator: React.FC = () => (
	<div className='tdc-col-separators' aria-hidden='true'>
		<span className='tdc-col-separator'>
			<span />
		</span>
	</div>
);

export default TokenDisplayColumnSeparator;
