import { createTheme } from '@mui/material/styles';
import useDarkMode from './useDarkMode';
import { tableStyleOverrideConstant } from '../helpers/constants';

const useTablestyle = () => {
	const { themeStatus } = useDarkMode();

	const theme = createTheme({
		palette: {
			mode: themeStatus,
			primary: {
				main: '#808080',
			},
		},
		// @ts-ignore
		overrides: tableStyleOverrideConstant,
		components: {
			MuiPaper: {
				styleOverrides: {
					root: {
						fontFamily: 'inherit',
						// Uncomment the below lines if needed
						// backgroundColor: 'black',
						// borderRadius: '1000px',
					},
				},
			},
			MuiPopover: {
				styleOverrides: {
					paper: {
						borderRadius: '10px',
					},
				},
			},
			MuiInputBase: {
				styleOverrides: {
					root: {
						fontFamily: 'inherit',
						'&::before': {
							border: '0 !important',
							display: 'none',
						},
						'&::after': {
							border: '0 !important',
							display: 'none',
						},
					},
				},
			},
			MuiMenuItem: {
				styleOverrides: {
					root: {
						fontFamily: 'inherit',
					},
				},
			},
			// MuiToolbar:{
			// 	styleOverrides:{
			// 		root:{
			// 			color: themeStatus !== 'dark' ? '#ffffff !important' : '#232323 !important',
			// 			backgroundColor: themeStatus !== 'dark' ? 'white !important' : '#232323 !important',

			// 		}
			// 	}
			// }
		},
	});

	// tableStyles.js
	const headerStyles = () => ({
		backgroundColor: themeStatus !== 'dark' ? '#F8FCFD' : '',
		fontWeight: 700,
		fontSize: '0.99rem',
		fontFamily: 'inherit',
		padding: '20px',
		whiteSpace: 'nowrap'
	});

	const headerStylesForSelection = () => ({

		backgroundColor: themeStatus !== 'dark' ? '#F8FCFD' : '',
		fontWeight: 700,
		fontSize: '0.99rem',
		fontFamily: 'inherit',
		padding: '15px 15px 15px 0',
		whiteSpace: 'nowrap',


	});

	const rowStyles = () => (rowData, index) => {
		if (index % 2 !== 0) {
			return {
				backgroundColor: themeStatus !== 'dark' ? '#F8FCFD' : '',
				borderRadius: '10px',
			};
		}
		return {};
	};

	/** @returns {import('react').CSSProperties} */
	const searchFieldStyle = () =>
		/** @type {import('react').CSSProperties} */ ({
			outline: 'none',
		});

	return { theme, headerStyles, rowStyles, searchFieldStyle, headerStylesForSelection };
};

export default useTablestyle;
