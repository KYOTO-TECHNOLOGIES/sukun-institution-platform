import React, { useState, useEffect } from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

function Alert(props) {
	return <MuiAlert elevation={6} variant='filled' {...props} />;
}

const AutohideSnackbar = ({ open, handleClose, severity, message }) => {
	const [snackbarOpen, setSnackbarOpen] = useState(open);

	useEffect(() => {
		setSnackbarOpen(open);
	}, [open]);

	const handleSnackbarClose = (event, reason) => {
		if (reason === 'clickaway') {
			return;
		}
		setSnackbarOpen(false);
		handleClose();
	};

	return (
		<Snackbar
			open={snackbarOpen}
			autoHideDuration={6000}
			onClose={handleSnackbarClose}
			anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
			<Alert onClose={handleSnackbarClose} severity={severity}>
				{message}
			</Alert>
		</Snackbar>
	);
};

export default AutohideSnackbar;
