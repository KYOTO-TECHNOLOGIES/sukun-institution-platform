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
			MuiTableCell: {
				styleOverrides: {
					root: {
						paddingLeft: '0 !important',
					},
				},
			},
			MuiInputBase: {
				styleOverrides: {
					root: {
						backgroundColor: themeStatus !== 'dark' ? '#ffffff' : '#333333',
						fontFamily: 'inherit',
						'&:hover': {
							borderColor: '#999 !important',
						},
						'&.Mui-focused': {
							borderColor: '#999 !important',
						},
						'&::before': {
							border: '0 !important',
						},
						'&::after': {
							border: '0 !important',
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
		},
	});

	const Tabletheme = createTheme({
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
			 MuiToolbar: {
        styleOverrides: {
            // root: {
                
            //     color: 'white',
            // },
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
						backgroundColor: themeStatus !== 'dark' ? '#ffffff' : '#333333',
						fontFamily: 'inherit',
						'&:hover': {
							borderColor: '#999 !important',
						},
						'&.Mui-focused': {
							borderColor: '#999 !important',
						},
						'&::before': {
							border: '0 !important',
						},
						'&::after': {
							border: '0 !important',
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
		},
	});


	const headerStyles = () => ({
		backgroundColor: themeStatus !== 'dark' ? '#F8F9FD' : '',
		fontWeight: 700,
		fontSize: '0.99rem',
		fontFamily: 'inherit',
		padding: '15px 15px 15px 0',
		whiteSpace: 'nowrap',
		// color:themeStatus !== 'dark'?'#73613F':'white'

	});
	const headerStylesWithPadding = () => ({

		backgroundColor: themeStatus !== 'dark' ? '#F8F9FD' : '',
		fontWeight: 700,
		fontSize: '0.99rem',
		fontFamily: 'inherit',
		padding: '15px',
		
		whiteSpace: 'nowrap',
		paddingLeft:'40px !important'
		// color: themeStatus !== 'dark' ? '#73613F' : 'white'


	});
	const rowStyles = () => (rowData, index) => {
		if (index % 2 !== 0) {
			return {
				// backgroundColor: themeStatus !== 'dark' ? '#FBF6F4' : '',
				backgroundColor: themeStatus !== 'dark' ? '#F5F5F5' : '',
				borderRadius: '10px',
				paddingleft: 0,
				
			
			};
		}
		return {};
	};
	const rowStylesWithPadding = () => (rowData, index) => {
		if (index % 2 !== 0) {
			return {
				backgroundColor: themeStatus !== 'dark' ? '#F5F5F5' : '',
				borderRadius: '10px',


			};
		}
		return {};
	};

	const cellStyles = () => (index, rowData, columnIndex) => ({
		position: 'sticky',
		right: 0,
		backgroundColor:
			index % 2 !== 0
				? '#222222'
				: themeStatus !== 'dark'
				? '#FBF6F4'
				: '#222222',
		zIndex: 1,
		textAlign: columnIndex === 0 ? 'left' : 'center',
	});

	const cellContentStyle = (columnIndex) => ({
		textAlign: columnIndex === 0 ? 'left' : 'center',
	});
	const filtterCellStyle = () => (rowData, index) => {
		return {
			position: 'sticky',
			right: 0,
			backgroundColor: 'white',
			zIndex: 9,
			minWidth: 150,
			maxWidth: 150,
			overflow: 'hidden',
		}
	};


	const searchFieldStyle = () => ({
		borderRadius: '10px',
		backgroundColor: themeStatus !== 'dark' ? '#F8F9FD' : '',
		padding: ' 4px 10px',
		fontFamily: 'inherit',
		fontSize: '0.95rem',
		border: '2px solid #C4C4C4',
		width: '220px',
		transition: 'border-color 0.3s ease',
	})

	return {
		theme,
		Tabletheme,
		headerStyles,
		rowStyles,
		headerStylesWithPadding,
		searchFieldStyle,
		rowStylesWithPadding,
		cellContentStyle,
		filtterCellStyle
	};
};

export default useTablestyle;