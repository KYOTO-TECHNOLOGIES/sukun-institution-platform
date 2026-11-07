import React from 'react';

/**
 * Custom Form Error Component
 * Displays validation errors for form fields
 */
interface FormErrorProps {
    error?: any;
    customMessage?: string;
    className?: string;
}

const FormError: React.FC<FormErrorProps> = ({ 
    error, 
    customMessage, 
    className = 'field-required-class' 
}) => {
    if (!error) {
        return null;
    }

    const getErrorMessage = (): string => {
        // If custom message is provided, use it
        if (customMessage) {
            return customMessage;
        }

        // Default messages based on error type
        switch (error.type) {
            case 'required':
                return '*Required';
            case 'pattern':
                return error.message || '*Invalid format';
            case 'minLength':
                return error.message || '*Minimum length required';
            case 'maxLength':
                return error.message || '*Maximum length exceeded';
            case 'min':
                return error.message || '*Value is too low';
            case 'max':
                return error.message || '*Value is too high';
            case 'validate':
                return error.message || '*Validation failed';
            default:
                return error.message || '*Invalid input';
        }
    };

    return (
        <span className={className} style={{ color: 'red', fontSize: '0.875rem' }}>
            {getErrorMessage()}
        </span>
    );
};

export default FormError;

