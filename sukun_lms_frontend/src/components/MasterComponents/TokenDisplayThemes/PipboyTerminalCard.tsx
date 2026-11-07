import React from 'react';
import PipboyLiveClock from './PipboyLiveClock';
import PipboyTerminalBackdrop from './PipboyTerminalBackdrop';
import FlipTokenDisplay from './FlipTokenDisplay';

export const PipboyTerminalBackdropLayer: React.FC = () => <PipboyTerminalBackdrop />;

export interface PipboyTerminalClockRowProps {
	fillContainer?: boolean;
}

export const PipboyTerminalClockRow: React.FC<PipboyTerminalClockRowProps> = ({
	fillContainer = false,
}) => <PipboyLiveClock fillContainer={fillContainer} />;

export interface PipboyTerminalTokenProps {
	value: string;
}

export const PipboyTerminalToken: React.FC<PipboyTerminalTokenProps> = ({ value }) => (
	<FlipTokenDisplay value={value} />
);
