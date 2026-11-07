import React, { useState } from 'react';
import TimeZoneSelector from './index';

/**
 * Example usage of TimeZoneSelector component
 * 
 * This file demonstrates different ways to use the TimeZoneSelector component
 * in your application.
 */

// Example 1: Basic Usage
export const BasicExample = () => {
	const [timezone, setTimezone] = useState('');

	return (
		<div className='container mt-4'>
			<TimeZoneSelector
				value={timezone}
				onChange={setTimezone}
				label='Select Your Time Zone'
				placeholder='Choose a timezone'
			/>
			<p className='mt-3'>Selected timezone: {timezone || 'None'}</p>
		</div>
	);
};

// Example 2: With Default Value
export const WithDefaultValueExample = () => {
	const [timezone, setTimezone] = useState('America/New_York');

	return (
		<div className='container mt-4'>
			<TimeZoneSelector
				value={timezone}
				onChange={setTimezone}
				label='Time Zone'
			/>
			<p className='mt-3'>Selected timezone: {timezone}</p>
		</div>
	);
};

// Example 3: Required Field in Form
export const RequiredFieldExample = () => {
	const [timezone, setTimezone] = useState('');

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
	};

	return (
		<form onSubmit={handleSubmit} className='container mt-4'>
			<TimeZoneSelector
				value={timezone}
				onChange={setTimezone}
				label='Time Zone'
				required
				placeholder='Please select your timezone'
			/>
			<button type='submit' className='btn btn-primary mt-3'>
				Submit
			</button>
		</form>
	);
};

// Example 4: Disabled State
export const DisabledExample = () => {
	const [timezone] = useState('Asia/Tokyo');

	return (
		<div className='container mt-4'>
			<TimeZoneSelector
				value={timezone}
				onChange={() => {}}
				label='Time Zone (Disabled)'
				disabled
			/>
		</div>
	);
};

// Example 5: Integration with Settings Form
export const SettingsFormExample = () => {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		timezone: 'UTC',
	});

	const handleTimezoneChange = (tz: string) => {
		setFormData((prev) => ({
			...prev,
			timezone: tz,
		}));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Here you would typically make an API call
		// authAxios.patch('/api/settings', formData)
	};

	return (
		<form onSubmit={handleSubmit} className='container mt-4'>
			<div className='mb-3'>
				<label htmlFor='name' className='form-label'>Name</label>
				<input
					type='text'
					className='form-control'
					id='name'
					value={formData.name}
					onChange={(e) => setFormData({ ...formData, name: e.target.value })}
				/>
			</div>
			
			<div className='mb-3'>
				<label htmlFor='email' className='form-label'>Email</label>
				<input
					type='email'
					className='form-control'
					id='email'
					value={formData.email}
					onChange={(e) => setFormData({ ...formData, email: e.target.value })}
				/>
			</div>
			
			<TimeZoneSelector
				value={formData.timezone}
				onChange={handleTimezoneChange}
				label='Time Zone'
				required
				className='mb-3'
			/>
			
			<button type='submit' className='btn btn-primary'>
				Save Settings
			</button>
		</form>
	);
};

