// useSetHeaderAndBreadcrumbs.ts
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setHeaderTitle, updateBreadCrumbs } from '../store/uiSlice';
// import { setHeaderTitle, updateBreadCrumbs } from '../store/UiSlice';

interface SetHeaderAndBreadcrumbsProps {
	name: string;
	path: string;
	isEditable?: boolean;
	url?: string;
	id?: string;
	fieldKey?: string;
}

const useSetHeaderAndBreadcrumbs = () => {
	const dispatch = useDispatch();

	const setHeaderAndBreadcrumbs = useCallback(
		({ name, path, isEditable = false, url, id, fieldKey }: SetHeaderAndBreadcrumbsProps) => {
			if (isEditable) {
				dispatch(setHeaderTitle({ name, isEditable, url, id, fieldKey }));
			} else {
				dispatch(setHeaderTitle({ name, isEditable }));
			}

			dispatch(updateBreadCrumbs({ label: name, path }));
		},
		[dispatch],
	);

	return setHeaderAndBreadcrumbs; // 🔁 not inside an object
};

export default useSetHeaderAndBreadcrumbs;
