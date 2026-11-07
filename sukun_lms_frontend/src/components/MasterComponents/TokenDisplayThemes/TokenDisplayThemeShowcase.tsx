/**
 * Grid of all display themes — for browsing themes.
 * For fill vs theme UX use ZoneDisplayThemePicker instead.
 */
import React, { useState } from 'react';
import TokenDisplayThemeCard from './TokenDisplayThemeCard';
import {
	createThemeAppearance,
	ZONE_DISPLAY_THEME_CONFIGS,
	ZONE_DISPLAY_THEME_IDS,
	type ZoneDisplayThemeId,
} from './tokenDisplayThemes';

const DEMO_LMS_NAME = 'Queue A';
const DEMO_SUBTITLE = '6th Floor';
const DEMO_TOKEN = '05';
const DEMO_STATUSES = ['waiting', 'serving', 'completed', 'postponed', 'cancelled'] as const;
type DemoStatus = (typeof DEMO_STATUSES)[number];

export interface TokenDisplayThemeShowcaseProps {
	onThemeSelect?: (themeId: ZoneDisplayThemeId) => void;
	selectedTheme?: ZoneDisplayThemeId | null;
	showControls?: boolean;
	showLabels?: boolean;
}

const TokenDisplayThemeShowcase: React.FC<TokenDisplayThemeShowcaseProps> = ({
	onThemeSelect,
	selectedTheme,
	showControls = true,
	showLabels = true,
}) => {
	const [demoStatus, setDemoStatus] = useState<DemoStatus>('waiting');
	const [demoToken, setDemoToken] = useState(DEMO_TOKEN);

	return (
		<div className='tdc-showcase'>
			{showControls && (
				<div className='d-flex flex-wrap align-items-center gap-3'>
					<div className='d-flex align-items-center gap-2'>
						<label htmlFor='tdc-demo-token' className='form-label mb-0 fw-semibold small'>
							Token
						</label>
						<input
							id='tdc-demo-token'
							type='text'
							className='form-control form-control-sm'
							style={{ width: 80 }}
							value={demoToken}
							maxLength={8}
							onChange={(e) => setDemoToken(e.target.value)}
						/>
					</div>
					<div className='d-flex align-items-center gap-2'>
						<span className='form-label mb-0 fw-semibold small'>Status</span>
						<div className='d-flex flex-wrap gap-1'>
							{DEMO_STATUSES.map((s) => (
								<button
									key={s}
									type='button'
									className={`btn btn-sm ${demoStatus === s ? 'btn-primary' : 'btn-outline-secondary'}`}
									onClick={() => setDemoStatus(s)}>
									{s}
								</button>
							))}
						</div>
					</div>
				</div>
			)}

			<div className='tdc-showcase__grid'>
				{ZONE_DISPLAY_THEME_IDS.map((themeId) => {
					const config = ZONE_DISPLAY_THEME_CONFIGS[themeId];
					const isSelected = selectedTheme === themeId;
					const isClickable = !!onThemeSelect;

					return (
						<div key={themeId} className='tdc-showcase__item'>
							<div
								role={isClickable ? 'button' : undefined}
								tabIndex={isClickable ? 0 : undefined}
								aria-pressed={isSelected || undefined}
								aria-label={`Select ${config.label} theme`}
								style={{
									outline: isSelected
										? '3px solid var(--bs-primary)'
										: '3px solid transparent',
									outlineOffset: '4px',
									borderRadius: '21px',
									cursor: isClickable ? 'pointer' : 'default',
									transition: 'outline-color 0.15s ease, transform 0.15s ease',
									transform: isSelected ? 'scale(1.03)' : undefined,
								}}
								onClick={() => onThemeSelect?.(themeId)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										onThemeSelect?.(themeId);
									}
								}}>
								<TokenDisplayThemeCard
									appearance={createThemeAppearance(themeId)}
									queueName={DEMO_LMS_NAME}
									subtitle={DEMO_SUBTITLE}
									tokenDisplay={demoToken}
									status={demoStatus}
									fillContainer
									previewMode
								/>
							</div>
							{showLabels && (
								<>
									<div className='tdc-showcase__item-label'>{config.label}</div>
									<div className='tdc-showcase__item-description'>
										{config.description}
									</div>
								</>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default TokenDisplayThemeShowcase;
