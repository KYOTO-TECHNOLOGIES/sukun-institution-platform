import React from 'react';
import Button from '../../bootstrap/Button';
import useDarkMode from '../../../hooks/useDarkMode';

const ApproveButton: React.FC<any> = (props) => {
	const { darkModeStatus } = useDarkMode();

	return (
		<Button
			color={darkModeStatus ? 'light' : 'dark'}
			isLight
			icon='Done'
			className='rounded-1 '
			size='sm'
			isOutline={true}
			style={{ width: '100px' }}
			{...props} // Spread all custom handlers like onClick
		>
			Approve
		</Button>
	);
};

export default ApproveButton;
