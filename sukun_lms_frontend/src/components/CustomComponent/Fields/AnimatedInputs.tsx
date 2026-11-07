import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import FormGroup from '../../bootstrap/forms/FormGroup';
import Input from '../../bootstrap/forms/Input';
import './AnimatedInput.css';

const AnimatedInputs = ({
	fields,
	formik,
	showPassword = null,
	togglePasswordVisibility = null,
	disbled = false,
	isStacked = false,
}) => {
	return (
		<>
			<div className='stack' style={{ perspective: '1200px', height: isStacked ? 130 : fields.length * 70 ,}}>
				<AnimatePresence mode="sync">
					{fields.map((field, index) => {
						const reverseIndex = index;
						const transparency = isStacked ? 1 - reverseIndex * 0.15 : 1;
						const scale = isStacked ? 1 - reverseIndex * 0.03 : 1;
						const rotateX = isStacked ? reverseIndex * 3 : 0;
						const rotateY = isStacked ? reverseIndex * 1 : 0;
						const zIndex = fields.length - index;
						const yOffset = isStacked ? reverseIndex * -8 : index * 70;
						const height = 60;

						const isPassword = field.name === 'loginPassword';
						const value = formik.values[field.name];
						const error = formik.errors[field.name];
						const touchedField = formik.touched[field.name];

						return (
							<motion.div
								key={field.name}
								initial={{
									height: 0,
									y: -20,
									scale: 0.95,
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
									scale: 0.95,
									rotateX: '0deg',
									rotateY: '0deg',
									height: 0,
								}}
								transition={{
									type: 'spring',
									stiffness: 100,
									damping: 15,
									mass: 1,
									restDelta: 0.001,
									duration: 0.5,
									height: {
										type: 'spring',
										stiffness: 200,
										damping: 20,
										mass: 1,
										duration: 0.4,
									},
								}}
								style={{
									// backgroundColor: `rgba(255, 255, 255, ${transparency})`,
									position: 'absolute',
									left: 0,
									right: 0,
									willChange: 'transform, opacity, height',
								}}>
								<FormGroup id={field.name} isFloating label={field.label}>
									<Input
										type={isPassword && !showPassword ? 'password' : 'text'}
										autoComplete='username'
										id={field.name}
										value={value}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
										isTouched={isStacked ? (index === 0 ? touchedField : false) : touchedField}
										invalidFeedback={isStacked ? (index === 0 ? error : '') : error}
										isValid={isStacked ? (index === 0 ? formik.isValid : true) : formik.isValid}
										disabled={disbled}
									/>
								</FormGroup>
								{isPassword && (
									<span
										onClick={togglePasswordVisibility}
										style={{
											position: 'absolute',
											top: 14,
											right: 30,
											cursor: 'pointer',
										}}>
										{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
									</span>
								)}
							</motion.div>
						);
					})}
				</AnimatePresence>
			</div>
		</>
	);
};

export default AnimatedInputs;
