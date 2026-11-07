import React from 'react';
import FormGroup from '../../bootstrap/forms/FormGroup';

interface InputWithCharCountProps {
	label: string;
	name?: string;
	maxLength: number;
	value: string;
	onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
	placeholder?: string;
	type?: 'text' | 'textarea';
	rows?: number;
	className?: string;
	error?: any;
	required?: boolean;
	disabled?: boolean;
	style?: React.CSSProperties;
	register?: any; // For react-hook-form
	[key: string]: any; // For additional props
}

const InputWithCharCount: React.FC<InputWithCharCountProps> = ({
	label,
	name,
	maxLength,
	value = '',
	onChange,
	placeholder,
	type = 'text',
	rows = 3,
	className = 'form-control',
	error,
	required = false,
	disabled = false,
	style,
	register,
	...rest
}) => {
	const currentLength = value?.length || 0;
	const remainingLength = maxLength - currentLength;
	const percentUsed = (currentLength / maxLength) * 100;

	// Determine color based on usage
	const getCountColor = () => {
		if (percentUsed >= 90) return '#dc3545'; // Red
		if (percentUsed >= 70) return '#ffc107'; // Yellow/Warning
		return '#6c757d'; // Gray/Secondary
	};

	const inputClassName = error ? `${className} is-invalid` : className;

	const commonProps = {
		className: inputClassName,
		placeholder,
		maxLength,
		disabled,
		style: style || (type === 'textarea' ? { minHeight: '100px' } : {}),
		...(register ? register : {}),
		...rest,
	};

	return (
		<FormGroup label={label}>
			{type === 'textarea' ? (
				<textarea rows={rows} {...commonProps} />
			) : (
				<input type="text" {...commonProps} />
			)}

			{/* Character Count Display */}
			<div
				style={{
					fontSize: '0.875rem',
					marginTop: '0.25rem',
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}>
				<span style={{ color: getCountColor(), fontWeight: 500 }}>
					{currentLength} / {maxLength} characters
				</span>
				<span
					style={{
						color: remainingLength < 20 ? '#dc3545' : '#6c757d',
						fontSize: '0.8rem',
					}}>
					{remainingLength} remaining
				</span>
			</div>

			{/* Error Message */}
			{error && (
				<div className="invalid-feedback" style={{ display: 'block' }}>
					{error.message || '*Required'}
				</div>
			)}
		</FormGroup>
	);
};

export default InputWithCharCount;

