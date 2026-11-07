import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { authAxios } from '../../axiosInstance';
import Button from '../bootstrap/Button';

interface InlineEditableFieldHeaderProps {
	initialValue: string;
	patchUrl: string;
	fieldKey: string; // e.g., 'name' or 'title'
	className?: string;
	id: string;
	onSuccess?: (newValue: string) => void;
}

const InlineEditableFieldHeader: React.FC<InlineEditableFieldHeaderProps> = ({
	initialValue,
	patchUrl,
	fieldKey,
	className = '',
	id,
	onSuccess,
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [value, setValue] = useState<string>(initialValue || '');
	const [loading, setLoading] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	// Update value when initialValue changes
	useEffect(() => {
		setValue(initialValue || '');
	}, [initialValue]);

	const handleBlurOrEnter = async () => {
		setIsEditing(false);

		if (value === initialValue) return;

		try {
			setLoading(true);
			await authAxios.patch(`${patchUrl}/${id}/`, { [fieldKey]: value });
			if (onSuccess) onSuccess(value);
		} catch (error) {
			console.error('Patch error:', error);
			setValue(initialValue); // revert on error
		} finally {
			setLoading(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleBlurOrEnter();
		} else if (e.key === 'Escape') {
			setIsEditing(false);
			setValue(initialValue);
		}
	};

	return (
		<div
			className={`position-relative ${className}`}
			onClick={() => {
				setIsEditing(true);
				setTimeout(() => inputRef.current?.focus(), 0);
			}}
			style={{ cursor: 'pointer' }}>
			{isEditing ? (
				<input
					ref={inputRef}
					type='text'
					value={value}
					disabled={loading}
					onChange={(e) => setValue(e.target.value)}
					onBlur={handleBlurOrEnter}
					onKeyDown={handleKeyDown}
					className={`inline-edit-input`}
				/>
			) : (
				<div className='editable-wrapper d-flex align-items-center'>
					<div className='fw-bold fs-6 mb-0'>{value}</div>

					<Button icon='Edit' className='edit-button m-0' />
				</div>
			)}
		</div>
	);
};

export default InlineEditableFieldHeader;
