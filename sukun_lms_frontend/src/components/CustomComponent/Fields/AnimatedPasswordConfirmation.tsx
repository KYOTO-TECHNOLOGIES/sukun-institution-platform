import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import FormGroup from '../../bootstrap/forms/FormGroup';
import Input from '../../bootstrap/forms/Input';
import './AnimatedInput.css';

const AnimatedPasswordConfirmation = ({ fields, formik }) => {
	const [isStacked, setIsStacked] = useState(true);

	useEffect(() => {
		setTimeout(() => {
			setIsStacked(false);
		}, 300);
	}, []);

	return (
		<>
			<div className='stack' style={{ perspective: '1200px' }}>
				<AnimatePresence initial={false}>
					{fields.map((field, index) => {
						const reverseIndex = fields.length - 1 - index; // Reverse the index to make first item most visible
						const transparency = isStacked ? 1 - reverseIndex * 0.15 : 1;
						const scale = isStacked ? 1 - reverseIndex * 0.03 : 1;
						const rotateX = isStacked ? reverseIndex * 3 : 0;
						const rotateY = isStacked ? reverseIndex * 1 : 0;
						const zIndex = fields.length - reverseIndex;
						const yOffset = isStacked ? reverseIndex * -8 : index * 70;
						const height = isStacked ? 60 : 60;

						const isPassword = field.name.toLowerCase().includes('password');
						const value = formik.values[field.name];
						const error = formik.errors[field.name];
						const touchedField = formik.touched[field.name];

						return (
							<motion.div
								key={field.name}
								initial={{
									height: 70,
									y: index * 80,
									scale: 1,
									opacity: 0,
									rotateX: '0deg',
									rotateY: '0deg',
								}}
								animate={{
									y: yOffset,
									scale,
									opacity: 1,
									zIndex,
									rotateX: `${rotateX}deg`,
									rotateY: `${rotateY}deg`,
									height,
									transformOrigin: 'center center',
								}}
								exit={{
									opacity: 0,
									y: -20,
									rotateX: '0deg',
									rotateY: '0deg',
									height: 0,
								}}
								transition={{
									type: 'spring',
									stiffness: 400,
									damping: 35,
									mass: 1,
									restDelta: 0.001,
									height: {
										type: 'spring',
										stiffness: 500,
										damping: 40,
										mass: 0.8,
										duration: 0.3,
									},
								}}
								style={{
									// backgroundColor: `rgba(255, 255, 255, ${transparency})`,
									position: 'absolute',
									left: 0,
									right: 0,
								}}>
								<FormGroup id={field.name} isFloating label={field.label}>
									<Input
										type='text'
										autoComplete={isPassword ? 'current-password' : 'username'}
										id={field.name}
										value={value}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										isTouched={touchedField}
										invalidFeedback={error}
										isValid={formik.isValid}
									/>
								</FormGroup>
							</motion.div>
						);
					})}
				</AnimatePresence>
			</div>
		</>
	);
};

export default AnimatedPasswordConfirmation;