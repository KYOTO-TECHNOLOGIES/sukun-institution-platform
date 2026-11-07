/**
 * Zone appearance picker — fill color OR display theme.
 * Drop into the zone properties panel when integrating.
 */
import React, { useCallback, useEffect, useState } from 'react';
import TokenDisplayThemeCard from './TokenDisplayThemeCard';
import {
	createFillAppearance,
	createThemeAppearance,
	ZONE_DISPLAY_THEME_CONFIGS,
	ZONE_DISPLAY_THEME_IDS,
	type ZoneDisplayAppearance,
	type ZoneDisplayThemeId,
} from './tokenDisplayThemes';

export interface ZoneDisplayThemePickerProps {
	value: ZoneDisplayAppearance;
	onChange: (next: ZoneDisplayAppearance) => void;
	/** Preview card content */
	previewQueueName?: string;
	previewSubtitle?: string;
	previewTokenDisplay?: string;
	previewStatus?: string;
	disabled?: boolean;
	/** Set when save validation fails — theme mode without a swatch selected. */
	showThemeError?: boolean;
}

const ZoneDisplayThemePicker: React.FC<ZoneDisplayThemePickerProps> = ({
	value,
	onChange,
	previewQueueName = 'Queue A',
	previewSubtitle = '6th Floor',
	previewTokenDisplay = '05',
	previewStatus = 'waiting',
	disabled = false,
	showThemeError = false,
}) => {
	const themeSelectionMissing = value.mode === 'theme' && !value.displayTheme;
	const showThemeErrorMessage = showThemeError && themeSelectionMissing;
	const [localFill, setLocalFill] = useState(value.backgroundColor ?? '#22499e');

	useEffect(() => {
		if (value.mode === 'fill' && value.backgroundColor) {
			setLocalFill(value.backgroundColor);
		}
	}, [value.mode, value.backgroundColor]);

	const setModeFill = useCallback(() => {
		onChange(createFillAppearance(localFill || '#22499e'));
	}, [localFill, onChange]);

	const setModeTheme = useCallback(
		(themeId: ZoneDisplayThemeId) => {
			onChange(createThemeAppearance(themeId));
		},
		[onChange],
	);

	const handleFillColorChange = useCallback(
		(color: string) => {
			setLocalFill(color);
			if (value.mode === 'fill') {
				onChange(createFillAppearance(color));
			}
		},
		[value.mode, onChange],
	);

	return (
		<div className='zone-appearance-picker'>
			<div className='zone-appearance-picker__modes'>
				
				<label className='zone-appearance-picker__mode-option'>
					<input
						type='radio'
						name='zone-appearance-mode'
						checked={value.mode === 'theme'}
						disabled={disabled}
						onChange={() => {
							onChange({
								mode: 'theme',
								displayTheme: value.displayTheme,
								backgroundColor: null,
							});
						}}
					/>
					<span>Display theme</span>
				</label>
				<label className='zone-appearance-picker__mode-option'>
					<input
						type='radio'
						name='zone-appearance-mode'
						checked={value.mode === 'fill'}
						disabled={disabled}
						onChange={setModeFill}
					/>
					<span>Fill color</span>
				</label>
			</div>

			{value.mode === 'fill' ? (
				<div className='zone-appearance-picker__fill-row'>
					<span className='zone-appearance-picker__label'>Fill color</span>
					<input
						type='color'
						className='zone-appearance-picker__color-input'
						value={localFill.startsWith('#') ? localFill : '#22499e'}
						disabled={disabled}
						onChange={(e) => handleFillColorChange(e.target.value)}
					/>
					<input
						type='text'
						className='form-control form-control-sm zone-appearance-picker__hex'
						value={localFill}
						disabled={disabled}
						onChange={(e) => handleFillColorChange(e.target.value)}
					/>
				</div>
			) : (
				<div
					className={`zone-appearance-picker__themes${showThemeErrorMessage ? ' zone-appearance-picker__themes--error' : ''}`}>
					<span className='zone-appearance-picker__label'>Theme</span>
					<div className='zone-appearance-picker__swatches'>
						{ZONE_DISPLAY_THEME_IDS.map((id) => {
							const config = ZONE_DISPLAY_THEME_CONFIGS[id];
							const selected = value.displayTheme === id;
							return (
								<button
									key={id}
									type='button'
									className={`tdc-swatch zone-appearance-picker__swatch${selected ? ' tdc-swatch--active' : ''}`}
									title={config.label}
									disabled={disabled}
									style={{ background: config.previewGradient }}
									aria-pressed={selected}
									onClick={() => setModeTheme(id)}
								/>
							);
						})}
					</div>
					{value.displayTheme && (
						<div className='zone-appearance-picker__theme-name'>
							{ZONE_DISPLAY_THEME_CONFIGS[value.displayTheme].label}
						</div>
					)}
					{showThemeErrorMessage && (
						<div className='tdc-name-error'>Please select a display theme.</div>
					)}
				</div>
			)}

			{value.mode === 'theme' && (
				<div className='zone-appearance-picker__preview'>
					<span className='zone-appearance-picker__label'>Preview</span>
					<div className='zone-appearance-picker__preview-card'>
						<TokenDisplayThemeCard
							appearance={value}
							queueName={previewQueueName}
							subtitle={previewSubtitle}
							tokenDisplay={previewTokenDisplay}
							status={previewStatus}
							fillContainer
							previewMode
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default ZoneDisplayThemePicker;
