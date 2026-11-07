import React from 'react';
import Button from '../../bootstrap/Button';
import useDarkMode from '../../../hooks/useDarkMode';

const RejectButton: React.FC<any> = (props) => {
	const { darkModeStatus } = useDarkMode();

	return (
		<Button
			color={darkModeStatus ? 'light' : 'danger'}
			isLight
			icon='Close'
			size='sm'
			style={{ width: '100px' }}
			{...props} // Spread all custom handlers like onClick
		>
			Reject
		</Button>
	);
};

export default RejectButton;
