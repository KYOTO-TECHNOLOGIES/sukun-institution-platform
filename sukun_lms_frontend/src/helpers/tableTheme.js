import { createTheme } from '@mui/material/styles';
import { tableStyleOverrideConstant } from './constants';

const theme = createTheme({
	// palette: {
	// 	type: themeStatus,
	// },
	// overrides: tableStyleOverrideConstant,
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
		MuiMenuItem: {
			styleOverrides: {
				root: {
					fontFamily: 'inherit',
				},
			},
		},
	},
});

export default theme;
