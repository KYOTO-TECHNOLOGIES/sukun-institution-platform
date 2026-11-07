import React from 'react';
import PropTypes from 'prop-types';
import Checks from '../bootstrap/forms/Checks';

const GroupCheckBoxList = ({ checkboxes, setCheckboxes, size, setAllSelect, allSelect }) => {
	const handleCheckboxChange = (id) => {
		if (allSelect) {
			setAllSelect(false);
		}
		setCheckboxes((prevCheckboxes) =>
			prevCheckboxes.map((checkbox) =>
				checkbox.id === id
					? {
							...checkbox,
							is_checked: !checkbox.is_checked,
						}
					: checkbox,
			),
		);
	};

	return (
		<div className='checkbox-list-container mt-4'>
			{checkboxes.map((checkbox) => (
				<div
					key={checkbox.id}
					className='mt-1 mb-3 '
					style={{ cursor: 'pointer', userSelect: 'none' }}>
					<Checks
						id={checkbox?.id}
						checked={checkbox.is_checked || false}
						label={checkbox?.group_name}
						name='example'
						onChange={() => handleCheckboxChange(checkbox.id)}
						style={
							size
								? {
										width: size,
										height: size,
										marginTop: '-1px',
										cursor: 'pointer',
										marginRight: '5px',
									}
								: { cursor: 'pointer' }
						}
					/>
				</div>
			))}
		</div>
	);
};
	/* eslint-disable react/forbid-prop-types */
GroupCheckBoxList.propTypes = {
	checkboxes: PropTypes.any.isRequired,
	setCheckboxes: PropTypes.func.isRequired,
	size: PropTypes.string.isRequired,
	setAllSelect: PropTypes.func.isRequired,
	allSelect: PropTypes.bool.isRequired,
};
  /* eslint-enable react/forbid-prop-types */
export default GroupCheckBoxList;
