import React from 'react';
import { Tooltip } from '@mui/material';
import Button from '../../bootstrap/Button';
import classNames from 'classnames';

const CustomButtonWithNoName = ({
	onClick = (e: any) => {
		e.stopPropagation();
		onClick(id);
	},
	id,
	icon,
	color = 'light',
	isLight,
	isOutline,
	width,
	size,
	loading,
	title,
	placement,
}: any) => {
	return (
		<Tooltip arrow title={title||''} placement={placement||'top'}>
		<Button
			className={classNames('text-nowrap', {
				'border-light': false,
			})}
			color={color}
			icon={icon}
			onClick={onClick}
			size={size}
			style={{ borderRadius: '10px' }}
			isLight
		/>
		</Tooltip>
	);
};

export default CustomButtonWithNoName;
