import React from 'react';
import classNames from 'classnames';
import { useDispatch } from 'react-redux'
import Card, { CardBody } from '../../../../components/bootstrap/Card';
import Button from '../../../bootstrap/Button';
import { useNavigate } from 'react-router-dom';
// import { setUserDetails } from '../../../store/user';
import ProfilePic from "../../../assets/img/11539820.png"
import { getFirstLetters } from '../../../../helpers/helpers';
import useDarkMode from '../../../../hooks/useDarkMode';
import Icon from '../../../icon/Icon';
import Badge from '../../../bootstrap/Badge';
import Dropdown, { DropdownItem, DropdownMenu, DropdownToggle } from '../../../bootstrap/Dropdown';
import { badgeColorOptions } from '../../../../helpers/constants';

const MopCard = ({ mop_data, handleDelete, handleStatusUpdate, handleEdit }) => {
	const navigate = useNavigate();
	const { darkModeStatus } = useDarkMode();


	return (
		<div className='col'>
			<Card borderSize={1} >
				<CardBody>
					<div className='row g-3'>
						<div className='col d-flex'>
							<div className='flex-shrink-0'>
								<div className='position-relative'>
										<div className='ratio ratio-1x1 me-3' style={{ width: 100, }}>
											<div
												className={classNames(
													'rounded-2',
													'd-flex align-items-center justify-content-center',
													{
														'bg-l10-dark': !darkModeStatus,
														'bg-l90-dark': darkModeStatus,
													},
												)}>
												<span className='fw-bold   ' style={{ fontSize: "20px" }}>{mop_data?.payment_mode && getFirstLetters(mop_data?.payment_mode)}</span>
											</div>
										</div>

                           

									{/* {mop_data.isOnline && (
										<span className='position-absolute top-100 start-85 translate-middle badge border border-2 border-light rounded-circle bg-success p-2'>
											<span className='visually-hidden'>Online mop_data</span>
										</span>
									)} */}
								</div>
							</div>
							<div className='flex-grow-1 ms-3 d-flex justify-content-between'>
								<div className='w-100'>
									<div className='row'>
										<div className='col'>
											<div className='d-flex align-items-center'>
												<div className='fw-bold fs-5 me-2'>
													{mop_data?.payment_mode} 
												</div>
													<small className={`border border-${badgeColorOptions[mop_data?.status]} border-2 text-${badgeColorOptions[mop_data?.status]} fw-bold px-2 py-1 rounded-1`}>
														{mop_data?.status || ''}
													</small>

											</div>
										</div>
                                        <div  className='col-auto cursor-pointer'>
                                <Dropdown >
									<DropdownToggle hasIcon={false}>
										<Icon
											icon='MoreHoriz'
											size='md'
										/>
									</DropdownToggle>
									<DropdownMenu isAlignmentEnd>
										<DropdownItem>
											<Button icon='Edit'
                                            onClick={() => handleEdit(mop_data)}
                                                >
												Edit
											</Button>
										</DropdownItem>

										<DropdownItem isDivider />
										<DropdownItem>
											<Button icon='Delete' 
											onClick={() => handleDelete(mop_data.id)}
                                            //  onClick={() => deleteAction()}
                                            >
												Delete
											</Button>
										</DropdownItem>
										<DropdownItem>
											<Button icon='LockOpen' 
											onClick={() => handleStatusUpdate(mop_data.id, mop_data?.status === 'Active' ? 'Disabled' : 'Active', mop_data?.status === 'Active' ? 'Mode of Payment will be disabled' : 'Mode of Payment will be enabled')}
                                            //  onClick={clickAction}
                                            >
												{mop_data?.status === 'Active' ? 'Disable' : 'Activate'}
											</Button>
										</DropdownItem>
									</DropdownMenu>
								</Dropdown>
								</div>

									</div>


									<Badge
										isLight
										color='primary'
										className='px-3 py-2 mt-2'>
										<Icon
											icon='Payments'
											size='lg'
											className='me-1'
										/>
										{mop_data?.payment_mode_id || ''}
									</Badge>
									{/* {!!mop_data?.services?.length && (
										<div className='row g-2 mt-3'>
											{mop_data.services.map((service) => (
												<div key={service.name} className='col-auto'>
													<Badge
														isLight
														color={service?.color}
														className='px-3 py-2'>
														<Icon
															icon={service.icon}
															size='lg'
															className='me-1'
														/>
														{service.name}
													</Badge>
												</div>
											))}
										</div>
									)} */}
								</div>
							</div>
						</div>
					</div>
				</CardBody>
			</Card>
		</div>
	);
};

export default MopCard;
