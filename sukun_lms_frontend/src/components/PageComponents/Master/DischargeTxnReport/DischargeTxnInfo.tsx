import React, { useEffect, useState } from 'react';
import Modal, { ModalBody, ModalHeader, ModalTitle } from '../../../../components/bootstrap/Modal';
import { authAxios } from '../../../../axiosInstance';
import useToasterNotification from '../../../../hooks/useToasterNotification';
import Moments from '../../../../helpers/Moment';
import ContractLogSkelton from '../../../../components/CustomComponent/Skeleton/ContractLogSkelton';
import CustomBadgeWithIcon from '../../../../components/CustomComponent/BadgeWithIcon';
import noimage from '../../../assets/img/no_image.png';
import Card, { CardBody } from '../../../bootstrap/Card';
import Icon from '../../../icon/Icon';
import ServiceRequestsCard from './ServiceRequestsCard';

type DischargeTxnInfoShowModalProps = {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    dischargeTxnInfo: any;
};
const dummyDischargeTxnInfoData = [
    {
        transaction_id: 'DT000218',
        gtcc_no: '1234567890',
        name: 'Blue Master Cleaning Services L.L.C',
        vehicle_no: '60993 P',
        driver_name: 'Raziq Noor',
        remarks: '600gl dumping in fujairah 0545',
        total_jobs: 11,
        entry_time: '2025-11-24 08:39 AM',
        exit_time: '2025-11-24 08:39 AM',
        vehicle_status: 'Exited',
        total_coupons: 0,
        total_gallons_collected: 590.00,
        total_gallon_discharged: 0.00,
        total_discharge_fee: 885.00,
        operator_acceptance: 'Accepted',
        status: 'completed',
    },
    {
        transaction_id: 'DT000218',
        gtcc_no: '1234567890',
        name: 'Blue Master Cleaning Services L.L.C',
        vehicle_no: '60993 P',
        driver_name: 'Raziq Noor',
        remarks: '600gl dumping in fujairah 0545',
        total_jobs: 11,
        entry_time: '2025-11-24 08:39 AM',
        exit_time: '2025-11-24 08:39 AM',
        vehicle_status: 'Exited',
        total_coupons: 0,
        total_gallons_collected: 590.00,
        total_gallon_discharged: 0.00,
        total_discharge_fee: 885.00,
        operator_acceptance: 'Accepted',
        status: 'completed',
    },
    {
        transaction_id: 'DT000218',
        gtcc_no: '1234567890',
        name: 'Blue Master Cleaning Services L.L.C',
        vehicle_no: '60993 P',
        driver_name: 'Raziq Noor',
        remarks: '600gl dumping in fujairah 0545',
        total_jobs: 11,
        entry_time: '2025-11-24 08:39 AM',
        exit_time: '2025-11-24 08:39 AM',
        vehicle_status: 'Exited',
        total_coupons: 0,
        total_gallons_collected: 590.00,
        total_gallon_discharged: 0.00,
        total_discharge_fee: 885.00,
        operator_acceptance: 'Accepted',
        status: 'completed',
    },
];

const dummyJobsData = [
    {
        sr_no: 'SR003977',
        entity_name: 'Carrefour City Centre Fujairah',
        no_of_traps: 1,
        assigned_vehicle: '60993 P',
        total_grease_collected: 100.00,
        collected_time: '2025-11-24 05:51 AM',
        discharged_time: '2025-11-24 08:39 AM',
        status: 'Discharged',
    },
    {
        sr_no: 'SR003976',
        entity_name: 'Carrefour City Centre Fujairah',
        no_of_traps: 1,
        assigned_vehicle: '60993 P',
        total_grease_collected: 100.00,
        collected_time: '2025-11-24 05:44 AM',
        discharged_time: '2025-11-24 08:39 AM',
        status: 'Discharged',
    },
    {
        sr_no: 'SR003975',
        entity_name: 'Carrefour City Centre Fujairah',
        no_of_traps: 1,
        assigned_vehicle: '60993 P',
        total_grease_collected: 100.00,
        collected_time: '2025-11-24 06:00 AM',
        discharged_time: '2025-11-24 08:39 AM',
        status: 'Discharged',
    },
    {
        sr_no: 'SR003975',
        entity_name: 'Carrefour City Centre Fujairah',
        no_of_traps: 1,
        assigned_vehicle: '60993 P',
        total_grease_collected: 100.00,
        collected_time: '2025-11-24 06:00 AM',
        discharged_time: '2025-11-24 08:39 AM',
        status: 'Discharged',
    },
];

const DischargeTxnInfoShowModal: React.FC<DischargeTxnInfoShowModalProps> = ({
    isOpen,
    setIsOpen,
    dischargeTxnInfo,
}) => {
    const [dischargeTxnInfoData, setDischargeTxnInfoData] = useState<any[]>([]);
    const [jobsData, setJobsData] = useState<any[]>(dummyJobsData);
    const [loader, setLoader] = useState(false);
    const { showErrorNotification } = useToasterNotification();

    const handleClose = () => setIsOpen(false);

    // useEffect(() => {
    // 	if (!dischargeTxnInfo) return;

    // 	const fetchDischargeTxnInfo = async () => {
    // 		try {
    // 			setLoader(true);
    // 			const response = await authAxios.get(
    // 				`/region/discharge-txns/${dischargeTxnInfo?.id}`
    // 			);
    // 			setDischargeTxnInfoData(response.data);
    // 		} catch (error) {
    // 			showErrorNotification(error);
    // 		} finally {
    // 			setLoader(false);
    // 		}
    // 	};

    // 	fetchDischargeTxnInfo();
    // }, []);

    if (!dischargeTxnInfo) return null;

    /** Modern compact row */
    const Row = (label: string, value: any, col = 4) => (
        <div className={`col-md-${col} mb-3`}>
            <div className="text-muted fw-semibold small mb-1">{label}</div>
            <div className="fw-semibold text-dark">{value || '—'}</div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            id="serviceInfoModal"
            titleId="serviceInfoModalTitle"
            isCentered
            size="xl"
        >
            <></>

            {/* HEADER */}
            <ModalHeader setIsOpen={handleClose}>
                <ModalTitle id="serviceInfoModalTitle">
                    <div className="d-flex align-items-center gap-3 p-2">
                        <div
                            style={{
                                background: 'linear-gradient(135deg,#667eea,#764ba2)',
                                borderRadius: '16px',
                                padding: '14px',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                            }}
                        >
                            <svg
                                width="26"
                                height="26"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14,2 14,8 20,8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <line x1="12" y1="9" x2="8" y2="9" />
                            </svg>
                        </div>

                        <div>
                            <h5 className="mb-0 fw-bold">Discharge Information</h5>
                            <p className="text-muted mb-0 small">Detailed discharge overview</p>
                        </div>
                    </div>
                </ModalTitle>
            </ModalHeader>

            {/* BODY */}
            <ModalBody className="pt-2 pb-4">
                {loader ? (
                    <></>
                ) : (
                    <>
                        <div className="d-flex flex-column gap-4">

                            {/* --- Service Info Card --- */}
                            <Card>
                                <CardBody>
                                    <h6 className="fw-bold mb-3 text-primary">General Information</h6>

                                    <div className="row">
                                        {Row('Txn ID', dischargeTxnInfo?.transaction_id || 'DT000218')}
                                        {Row('GTCC No', dischargeTxnInfo?.gtcc_no || '1234567890')}
                                        {Row('GTCC Name', dischargeTxnInfo?.name || 'Blue Master Cleaning Services L.L.C')}

                                        {Row('Driver', dischargeTxnInfo?.driver_name || 'Raziq Noor')}
                                        {Row('Remarks', dischargeTxnInfo?.remarks || '600gl dumping in fujairah 0545')}
                                        {Row('Total Jobs', dischargeTxnInfo?.total_jobs || 11)}

                                        {Row('Assigned Vehicle', dischargeTxnInfo?.vehicle_no || '60993 P')}
                                        {Row('Entry Time', dischargeTxnInfo?.entry_time || '2025-11-24 08:39 AM')}
                                        {Row('Exit Time', dischargeTxnInfo?.exit_time || '2025-11-24 08:39 AM')}

                                        {/* Vehicle Status */}
                                        <div className="col-md-4 mb-3">
                                            <div className="text-muted fw-semibold small mb-1">Vehicle Status</div>
                                            <CustomBadgeWithIcon>{dischargeTxnInfo?.vehicle_status || 'Exited'}</CustomBadgeWithIcon>
                                        </div>

                                        {Row('Total Coupons', dischargeTxnInfo?.total_coupons || 0)}

                                        {Row('Total Gallons Collected', dischargeTxnInfo?.total_gallons_collected ? `${dischargeTxnInfo.total_gallons_collected.toFixed(2)} Gallons` : '590.00 Gallons')}
                                        {Row('Total Gallon Discharged', dischargeTxnInfo?.total_gallon_discharged ? `${dischargeTxnInfo.total_gallon_discharged.toFixed(2)} Gallons` : '0.00 Gallons')}
                                        {Row('Total Discharge Fee', dischargeTxnInfo?.total_discharge_fee ? dischargeTxnInfo.total_discharge_fee.toFixed(2) : '885.00')}

                                        {/* Operator Acceptance */}
                                        <div className="col-md-4 mb-3">
                                            <div className="text-muted fw-semibold small mb-1">Operator Acceptance</div>
                                            <CustomBadgeWithIcon>{dischargeTxnInfo?.operator_acceptance || 'Accepted'}</CustomBadgeWithIcon>
                                        </div>

                                        {/* Status */}
                                        <div className="col-md-4 mb-3">
                                            <div className="text-muted fw-semibold small mb-1">Status</div>
                                            <CustomBadgeWithIcon>
                                                {dischargeTxnInfo?.status?.replace('_', ' ') || 'Completed'}
                                            </CustomBadgeWithIcon>
                                        </div>
                                    </div>

                                </CardBody>
                            </Card>

                            {/* --- Jobs List Card --- */}
                            <div className="px-3">
                                <h6 className="fw-bold mb-4 text-primary">service requests</h6>

                                <div className="d-flex flex-column gap-3" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                    {jobsData.map((job, index) => (
                                        <ServiceRequestsCard key={index} data={job} />
                                    ))}
                                </div>
                            </div>

                        </div>
                    </>
                )}
            </ModalBody>
        </Modal >
    );
};

export default DischargeTxnInfoShowModal;
