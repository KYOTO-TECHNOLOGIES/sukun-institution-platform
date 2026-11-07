import React from 'react';
import classNames from 'classnames';
import { useDispatch } from 'react-redux'
import Card, { CardBody } from '../../../components/bootstrap/Card';
import Button from '../../bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import { setUserDetails } from '../../../store/user';
import ProfilePic from "../../../assets/img/11539820.png"
import { getFirstLetters } from '../../../helpers/helpers';
import useDarkMode from '../../../hooks/useDarkMode';
import Icon from '../../icon/Icon';
import Badge from '../../bootstrap/Badge';
import { partyTypeOptions } from '../../../helpers/constants';

const UserCard = ({ user }) => {
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
									{user?.avatar_thumbnail ?
										<div className='ratio ratio-1x1' style={{ width: 100 }}>
											<div
												className={classNames(
													`bg-l25-${user.color}`,
													'rounded-1',
													'd-flex align-items-center justify-content-center',
													'overflow-hidden',
													''
												)}>
												<img
													src={user?.avatar_thumbnail || ProfilePic}
													alt={user?.full_name || user?.first_name || ''}
													width={100}
												/>
											</div>
										</div> :

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
												<span className='fw-bold   ' style={{ fontSize: "20px" }}>{user?.full_name && getFirstLetters(user?.full_name)}</span>
											</div>
										</div>
									}


									{/* {user.isOnline && (
										<span className='position-absolute top-100 start-85 translate-middle badge border border-2 border-light rounded-circle bg-success p-2'>
											<span className='visually-hidden'>Online user</span>
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
													{user?.full_name}
												</div>
												{/* {user?.designation?.name && */}
													{/* <small className='border border-success border-2 text-success fw-bold px-2 py-1 rounded-1'>
														{user?.designation?.name || ''}
													</small> */}
												{/* } */}

											</div>
											<div className='text-muted'>{user?.email || ''}</div>
											{/* <div className='text-muted'>{user?.personal_contact_number || ''}</div> */}
										</div>
										<div className='col-auto '>
											<Button
												icon='Info'
												color='dark'
												isLight
												hoverShadow='sm'
												tag='a'
												onClick={() => { navigate(`/users/usermanagement/${user.id}`) }}
												data-tour={user.full_name}
												aria-label='More info'
											/>
										</div>
									</div>


									<Badge
										isLight
										color='primary'
										className='px-3 py-2 mt-2'>
										<Icon
											icon={partyTypeOptions[user?.party_type]}
											size='lg'
											className='me-1'
										/>
										{user?.party_type || ''}
									</Badge>
									{/* {!!user?.services?.length && (
										<div className='row g-2 mt-3'>
											{user.services.map((service) => (
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

export default UserCard;
