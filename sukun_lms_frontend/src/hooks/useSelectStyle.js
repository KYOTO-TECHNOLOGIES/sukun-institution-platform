import {
	customStyleForMultiSelect,
	customStyleForMultiSelectDarkMode,
	customStyles,
	customStylesDark,
} from '../helpers/constants';
import useDarkMode from './useDarkMode';

const useSelectStyles = (isMulti = false) => {
	const { darkModeStatus } = useDarkMode();
	if (isMulti) {
		return darkModeStatus ? customStyleForMultiSelectDarkMode : customStyleForMultiSelect;
	}
	return darkModeStatus ? customStylesDark : customStyles;
};

export default useSelectStyles;
