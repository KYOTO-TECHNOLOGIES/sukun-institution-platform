import React, { useState } from 'react';
import PropTypes from 'prop-types';
import DescriptionIcon from '@mui/icons-material/Description';
import downloadHandler from '../../helpers/DownloadCsv';
import { validationlist } from '../../helpers/constants';

const ImportInstructions = ({ api, fileName }) => {
	const [isLoading, setIsloading] = useState()
	const handleKeyDown = (e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			downloadHandler(api, fileName, setIsloading);
		}
	};
	return (
		<div className='upload-instructions'>
			<h5>Step 1: Prepare Your File</h5>
			<ol>
				<li>
					<p className='highlight download-temp'>Download the Template:</p> Click on the
					provided link to download the sample template
					<span
						onClick={() => downloadHandler(api, fileName, setIsloading)}
						style={{
							color: '#4D69FA',
							marginLeft: '3px',
							cursor: 'pointer',
						}}
						onKeyDown={handleKeyDown}
						tabIndex={0}
						role='button'
						aria-label={`Download ${fileName} template`}>
						<u>{fileName}</u>
						<DescriptionIcon
							style={{
								fontSize: '18px',
								marginTop: '-5px',
								color: '#4D69FA',
								marginLeft: '5px',
							}}
						/>
					</span>{' '}
					to ensure quick and error-free data upload.
				</li>
				<li>
					<span className='highlight'>Enter Your Data:</span> Open the template, input
					your data, and ensure all fields are mapped correctly to hold the data as
					required by the template. Enter the details row by row.
				</li>
				<p className='note'>
					<ul>
						{validationlist.map((item) => (
							<li
								className='mb-2'
								style={{
									fontWeight: 400,
									fontSize: '13px',
								}}
								key={item}>
								{item}
							</li>
						))}
					</ul>
				</p>
				<li>
					<span className='highlight'>Save the File:</span> Save your completed file in
					the “<span className='highlight'>.csv </span>format.
				</li>
			</ol>

			<h5>Step 2: Upload the File</h5>
			<ol>
				<li>
					<span className='highlight'>Choose Your File:</span> Click on the "Choose File"
					button to open the file browser and locate your saved data file.
				</li>
				<li>
					<span className='highlight'>Select and Upload:</span> Select the appropriate
					file and click "Open".
				</li>
			</ol>

			<h5>Step 3: Finalize and Verify</h5>
			<ol>
				<li>
					<span className='highlight'>Upload:</span> Click the "Save" button to start
					the bulk data Upload process.
				</li>
				<li>
					<span className='highlight'>Verify:</span> Check the application to ensure that
					all the data has been correctly uploaded and is visible in the system.
				</li>
			</ol>

			{/* <p>
				<span className='highlight'>Troubleshooting:</span> If errors occur during import,
				review the error message, correct the file, and re-upload.
			</p> */}
		</div>
	);
};
/* eslint-disable react/forbid-prop-types */
ImportInstructions.propTypes = {
	fileName: PropTypes.string.isRequired,
	api: PropTypes.string.isRequired,
};
/* eslint-enable react/forbid-prop-types */
export default ImportInstructions;
