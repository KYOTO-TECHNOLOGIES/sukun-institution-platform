import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

const EnterOtpComponent = ({ waitingForAxios, otp, setOtp }) => {
	// const [error, setError] = useState(null);
	const inputRefs = [
		useRef(null),
		useRef(null),
		useRef(null),
		useRef(null),
		useRef(null),
		useRef(null),
		
	];
	const InputsCount = [0, 1, 2, 3, 4, 5,];
	const handlePaste = (event) => {
		event.preventDefault();
		const pastedData = event.clipboardData.getData('text/plain').trim();

		// Filter out non-numeric characters from the pasted data
		const numericData = pastedData.replace(/[^\d]/g, '');

		// Process the filtered numeric data
		if (numericData.match(/^\d{1,5}$/)) {
			const newDigits = numericData.padEnd(5, '0').split('').slice(0, 8);
			setOtp(newDigits);

			newDigits.forEach((digit, index) => {
				inputRefs[index].current.value = digit;
			});
		} else {
			const firstFiveDigits = numericData.substring(0, 8);
			setOtp(firstFiveDigits.split(''));

			firstFiveDigits.split('').forEach((digit, index) => {
				inputRefs[index].current.value = digit;
			});
		}
	};

	const handleChange = (index, value) => {
		const newDigits = [...otp];
		newDigits[index] = value;
		setOtp(newDigits);

		if (value.length === 1 && index < 5) {
			inputRefs[index + 1].current.focus();
		} else if (value.length === 0 && index > 0) {
			inputRefs[index - 1].current.focus();
		}
	};

	// useEffect(() => {
	// 	return () => {
	// 		setOtp(['', '', '', '', '', '']);
	// 	}
	// }, []);

	return (
		<>
		
			<div
				id='otp'
				className='d-flex justify-content-center gap-2'
				style={{ marginBottom: '45px'}}>
				{InputsCount.map((index) => (
					<motion.div
						key={index}
						initial={{ opacity: 0, x: 40 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{
							duration: 0.3,
							delay: index * 0.07,
							type: 'spring',
							stiffness: 100,
						}}>
						<input
							key={index}
							ref={inputRefs[index]}
							disabled={waitingForAxios}
							type='text'
							className='form-control'
							maxLength={1}
							value={otp[index]}
							onChange={(e) => handleChange(index, e.target.value)}
							onPaste={handlePaste}
							style={{ width: '40px', height: '40px', textAlign: 'center' }}
							// @ts-ignore
							onWheel={(e) => e.target.blur()}
							onInput={(e) => {
								// @ts-ignore
								e.target.value = e.target.value.replace(/\D/g, ''); // Allow only digits
								// @ts-ignore
								e.target.value = e.target.value.slice(0, 1); // Restrict to maximum length of 1 digit
							}}
						/>
					</motion.div>
				))}
			</div>
		</>
	);
};
/* eslint-disable react/forbid-prop-types */
EnterOtpComponent.propTypes = {
	waitingForAxios: PropTypes.bool.isRequired,
	setOtp: PropTypes.func.isRequired,
	otp: PropTypes.array.isRequired,
};
/* eslint-enable react/forbid-prop-types */

export default EnterOtpComponent;
