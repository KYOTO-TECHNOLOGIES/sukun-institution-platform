import React from 'react'
import Button from '../../bootstrap/Button'
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '../../bootstrap/Dropdown'

function DropDownFilter({
	options,
	onChange,
	selectedOption,
	color,
	labelField,
	direction,
	icon,
	buttonClassName,
}: any) {
    const formattingLabel = (label: string) => {
        if (!label) return 'Select';
        return label.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    }

    return (
        <Dropdown direction={direction}>
            <DropdownToggle hasIcon>
                <Button color="primary" isLight icon={icon} className={buttonClassName}>
                    {formattingLabel(selectedOption?.[labelField]) || 'Select'}
                </Button>
            </DropdownToggle>
            <DropdownMenu
                color={color}

            >
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {options.map((option, index) => (
                        <DropdownItem
                            key={index}
                            onClick={() => onChange(option)}
                        >
                            {formattingLabel(option[labelField])}
                        </DropdownItem>
                    ))}
                </div>
            </DropdownMenu>
        </Dropdown>
    )
}

export default DropDownFilter