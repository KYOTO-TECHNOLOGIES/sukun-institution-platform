import React, { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header, { HeaderLeft } from './Header';
import AuthContext from '../../contexts/authContext';
import MainHeaderRight from './HeaderRight';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveTab , setHeaderTitle , setBreadcrumbs} from '../../store/uiSlice';
import InlineEditableFieldHeader from '../../components/CustomComponent/InlineEditableFieldHeader';

interface Breadcrumb {
	label: string;
	path: string;
}

interface UIState {
	headerTitle: any;
	breadcrumbs: Breadcrumb[];
}

interface RootState {
	UiSlice: UIState;
}

const MainHeader = () => {
	const { userData } = useContext(AuthContext);
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const headerTitle = useSelector((state: RootState) => state.UiSlice.headerTitle);
	const breadcrumbs = useSelector((state: RootState) => state.UiSlice.breadcrumbs);


	const handleBreadcrumbClick = (index: number) => {
		const clickedCrumb = breadcrumbs[index];
		const trimmed = breadcrumbs.slice(0, index + 1);

		if(window.location.pathname.includes('/sites/') && clickedCrumb.label !=='Locations' && clickedCrumb.label !=='Home'){
			dispatch(setActiveTab(clickedCrumb.path));
		}else{
		
			navigate(clickedCrumb.path);
		}

		dispatch(setBreadcrumbs(trimmed));
		dispatch(setHeaderTitle({ name: clickedCrumb.label, isEditable: false }));

	
	};

	return (
		<Header>
			<HeaderLeft>
				<div className='col d-flex align-items-center'>
					<div className='prevent-userselect'>
						{headerTitle.isEditable ? (
							<InlineEditableFieldHeader
								initialValue={headerTitle?.name}
								patchUrl={headerTitle?.url || ''}
								fieldKey={headerTitle?.fieldKey || ''}
								id={headerTitle?.id || ''}
							/>
						) : (
							<div className='fw-bold fs-6 mb-0'>{headerTitle?.name}</div>
						)}

						<div className='text-muted d-flex gap-1'>
							<small>
								{breadcrumbs.map((crumb, index) => (
									<span key={index}>
										{index > 0 && ' > '}
										{index < breadcrumbs.length - 1 ? (
											<span
												className=''
												style={{ cursor: 'pointer' }}
												onClick={() => handleBreadcrumbClick(index)}>
												{crumb.label}
											</span>
										) : (
											<span>{crumb.label}</span>
										)}
									</span>
								))}
							</small>
						</div>
					</div>
				</div>
			</HeaderLeft>
			<MainHeaderRight />
		</Header>
	);
};

export default MainHeader;
