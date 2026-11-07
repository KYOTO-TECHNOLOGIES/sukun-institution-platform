import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface FlipTokenDisplayProps {
	value: string;
	className?: string;
}

const FLIP_FALLBACK_MS = 500;

function FlipDigit({ char }: { char: string }) {
	const [shown, setShown] = useState(char);
	const [prev, setPrev] = useState<string | null>(null);
	const [flipping, setFlipping] = useState(false);
	const skipFlipRef = useRef(true);
	const pendingCharRef = useRef(char);

	const finishFlip = useCallback(() => {
		const next = pendingCharRef.current;
		setShown(next);
		setFlipping(false);
		setPrev(null);
	}, []);

	useEffect(() => {
		pendingCharRef.current = char;

		if (skipFlipRef.current) {
			skipFlipRef.current = false;
			setShown(char);
			return;
		}
		if (char === shown || flipping) return;

		setPrev(shown);
		setFlipping(true);
	}, [char, shown, flipping]);

	useEffect(() => {
		if (!flipping) return undefined;
		const fallback = window.setTimeout(finishFlip, FLIP_FALLBACK_MS);
		return () => window.clearTimeout(fallback);
	}, [flipping, finishFlip]);

	return (
		<span className={`flip-digit${flipping ? ' flip-digit--flipping' : ''}`}>
			<span className='flip-digit__top' aria-hidden='true'>
				<span className='flip-digit__text flip-digit__text--top'>
					{flipping && prev != null ? prev : shown}
				</span>
			</span>
			<span className='flip-digit__bottom' aria-hidden='true'>
				<span className='flip-digit__text flip-digit__text--bottom'>
					{flipping && prev != null ? prev : shown}
				</span>
			</span>
			{flipping && prev != null && (
				<span
					className='flip-digit__flip'
					aria-hidden='true'
					onAnimationEnd={(event) => {
						if (!event.animationName.includes('pipboy-digit-flip')) return;
						finishFlip();
					}}>
					<span className='flip-digit__flip-front'>
						<span className='flip-digit__text flip-digit__text--top'>{prev}</span>
					</span>
				</span>
			)}
		</span>
	);
}

const FlipTokenDisplay: React.FC<FlipTokenDisplayProps> = ({ value, className = '' }) => {
	const chars = value.split('');

	return (
		<span className={`flip-token${className ? ` ${className}` : ''}`}>
			{chars.map((char, index) => (
				<FlipDigit key={index} char={char} />
			))}
		</span>
	);
};

export default FlipTokenDisplay;
