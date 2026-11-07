import React from 'react';
import Button from '../bootstrap/Button';

interface ThumbnailSizeControlProps {
	value: number;
	min: number;
	max: number;
	step?: number;
	onIncrease: () => void;
	onDecrease: () => void;
	onChange: (value: number) => void;
	label?: string;
}

const ThumbnailSizeControl: React.FC<ThumbnailSizeControlProps> = ({
	value,
	min,
	max,
	step = 12,
	onIncrease,
	onDecrease,
	onChange,
	label = 'Thumbnail size',
}) => {
	return (
		<div className='app-thumb-size-controls' role='group' aria-label={label}>
			<span className='app-thumb-size-icon' aria-hidden='true'>
				<svg width='18' height='18' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
					<rect x='1.5' y='2' width='13' height='12' rx='2' stroke='currentColor' strokeWidth='1.3' />
					<circle cx='5.2' cy='6.2' r='1.2' fill='currentColor' />
					<path
						d='M2.7 12L6.3 8.8C6.7 8.45 7.3 8.45 7.7 8.8L9.6 10.45C10.03 10.82 10.67 10.79 11.05 10.37L13.3 7.9'
						stroke='currentColor'
						strokeWidth='1.3'
						strokeLinecap='round'
						strokeLinejoin='round'
					/>
				</svg>
			</span>

			<Button
				type='button'
				color='light'
				isLight
				className='app-thumb-size-btn'
				onClick={onDecrease}
				isDisable={value <= min}>
				-
			</Button>

			<input
				type='range'
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				aria-label={label}
				className='app-thumb-size-range'
			/>

			<Button
				type='button'
				color='light'
				isLight
				className='app-thumb-size-btn'
				onClick={onIncrease}
				isDisable={value >= max}>
				+
			</Button>
		</div>
	);
};

export default ThumbnailSizeControl;
