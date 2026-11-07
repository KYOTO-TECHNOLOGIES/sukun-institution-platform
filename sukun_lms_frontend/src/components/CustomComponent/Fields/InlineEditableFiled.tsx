import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { authAxios } from '../../../axiosInstance';
import Button from '../../bootstrap/Button';

interface InlineEditableFieldProps {
    initialValue: string;
    patchUrl: string;
    fieldKey: string; // e.g., 'name' or 'title'
    className?: string;
    id: string;
    onSuccess?: (newValue: string) => void;
    type: string;
    styles:any
}

const InlineEditableField: React.FC<InlineEditableFieldProps> = ({
    initialValue,
    patchUrl,
    fieldKey,
    className = '',
    id,
    onSuccess,
    type,
    styles
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
            style={{ cursor: 'pointer', ...styles }}>
            {isEditing ? (
                // <div style={{height:'40px'}}>
                <input
                    ref={inputRef}
                    type='text'
                    value={value}
                    disabled={loading}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleBlurOrEnter}
                    onKeyDown={handleKeyDown}
                    className={`inline-edit-input p `}
                    style={{width:"150px",fontSize:'1.1rem',fontWeight:'bold'}}
                />
                // </div>
            ) : (
                <div className='editable-wrapper d-flex align-items-center' >
                    <p style={{marginTop:'17px'}}>{value}</p>
                    <Button icon='Edit' className='edit-button m-0' />
                </div>
            )}
        </div>
    );
};

export default InlineEditableField;
