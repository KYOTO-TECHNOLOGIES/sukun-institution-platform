import React, { useCallback, useState } from 'react';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '../../bootstrap/Dropdown';
import Button from '../../bootstrap/Button';
import { buttonColor } from '../../../helpers/constants';
import swalFire from '../../../helpers/swalHelper';
import type { TColor } from '../../../type/color-type';
import type { TDropdownDirection } from '../../../type/dropdown-type';
import useDarkMode from '../../../hooks/useDarkMode';

export interface SplitDropdownMenuItem {
	label: string;
	onClick: () => void;
}

export interface SplitDropdownButtonProps {
	mainLabel: React.ReactNode;
	mainIcon?: string;
	color?: TColor;
	mainIsLight?: boolean;
	/** Direction the menu opens. Default 'down'. Pass 'up' to open above the button. */
	dropdownDirection?: TDropdownDirection;
	isOutline?: boolean;
	isDisable?: boolean;
	mainTitle?: string;
	className?: string;
	dropdownMenuAlignmentEnd?: boolean;
	/** When true (default), choosing a menu row opens SweetAlert2 before running `onClick`. Main button is never confirmed. */
	confirmMenuSelection?: boolean;
	confirmMenuTitle?: string;
	confirmMenuText?: string | ((item: SplitDropdownMenuItem) => string);
	onMainClick: () => void;
	menuItems: SplitDropdownMenuItem[];
}

/**
 * Split primary button + caret dropdown (same pattern as `ButtonWithPopover`).
 * Empty `menuItems` → single main button only.
 */
const SplitDropdownButton: React.FC<SplitDropdownButtonProps> = ({
	mainLabel,
	mainIcon,
	color = 'primary',
	mainIsLight = true,
	dropdownDirection = 'down',
	isOutline = false,
	isDisable = false,
	mainTitle,
	className,
	dropdownMenuAlignmentEnd = true,
	confirmMenuSelection = true,
	confirmMenuTitle = 'Confirm action',
	confirmMenuText,
	onMainClick,
	menuItems,
}) => {
	const [open, setOpen] = useState(false);
	const hasMenu = menuItems.length > 0;
	const { themeStatus } = useDarkMode();
	const handleMenuItemClick = useCallback(
		async (item: SplitDropdownMenuItem) => {
			setOpen(false);
			if (!confirmMenuSelection) {
				item.onClick();
				return;
			}
			const text =
				typeof confirmMenuText === 'function'
					? confirmMenuText(item)
					: (confirmMenuText ?? `Proceed with: ${item.label}?`);
			const result = await swalFire({
				title: confirmMenuTitle,
				text,
				icon: 'question',
				showCancelButton: true,
				iconColor: buttonColor[0],
				confirmButtonColor: buttonColor[0],
				cancelButtonColor: buttonColor[1],
				theme: themeStatus === 'dark' ? 'dark' : 'light',
				reverseButtons: true,
				confirmButtonText: 'Proceed',
				cancelButtonText: 'Cancel',
			});
			if (result.isConfirmed) item.onClick();
		},
		[confirmMenuSelection, confirmMenuTitle, confirmMenuText],
	);

	if (!hasMenu) {
		return (
			<Button
				color={color}
				isLight={mainIsLight}
				isOutline={isOutline}
				icon={mainIcon}
				isDisable={isDisable}
				title={mainTitle}
				className={className}
				onClick={onMainClick}>
				{mainLabel}
			</Button>
		);
	}

	return (
		<Dropdown
			isButtonGroup
			className={className}
			direction={dropdownDirection}
			isOpen={open}
			setIsOpen={setOpen}>
			<Button
				color={color}
				isLight={mainIsLight}
				isOutline={isOutline}
				icon={mainIcon}
				isDisable={isDisable}
				title={mainTitle}
				onClick={onMainClick}>
				{mainLabel}
			</Button>
			<DropdownToggle>
				<Button
					color={color}
					isLight={mainIsLight}
					isOutline={isOutline}
					isVisuallyHidden
				/>
			</DropdownToggle>
			<DropdownMenu isAlignmentEnd={dropdownMenuAlignmentEnd}>
				{menuItems.map((item, index) => (
					<DropdownItem key={`${item.label}-${index}`}>
						<Button
							isDisable={isDisable}
							onClick={() => {
								void handleMenuItemClick(item);
							}}>
							{item.label}
						</Button>
					</DropdownItem>
				))}
			</DropdownMenu>
		</Dropdown>
	);
};

export default SplitDropdownButton;
