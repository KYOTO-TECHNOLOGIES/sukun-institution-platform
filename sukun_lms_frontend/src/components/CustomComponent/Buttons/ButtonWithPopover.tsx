import React from 'react';
import Dropdown, {
	DropdownItem,
	DropdownMenu,
	DropdownToggle,
} from '../../bootstrap/Dropdown';
import Button from '../../bootstrap/Button';

const ButtonWithPopover = ({addModalShow,addBulkModalShow,buttonName}:any) => {
	return (
		<Dropdown isButtonGroup >
			<Button color='primary' isLight icon='Add' onClick={() => addModalShow(true)} >
				{buttonName||"Add New"}
			</Button>
			<DropdownToggle>
				<Button color='primary' isLight isVisuallyHidden />
			</DropdownToggle>
			<DropdownMenu isAlignmentEnd>
				<DropdownItem>
					<Button onClick={() => addBulkModalShow(true)}>Bulk Upload</Button>
				</DropdownItem>
			</DropdownMenu>
		</Dropdown>
	);
};

export default ButtonWithPopover;
