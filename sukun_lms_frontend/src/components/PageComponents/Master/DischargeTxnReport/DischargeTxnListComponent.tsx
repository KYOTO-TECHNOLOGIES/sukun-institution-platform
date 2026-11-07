import React, { useEffect, useRef, useState } from 'react';
import MaterialTable from '@material-table/core';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import FilterListIcon from '@mui/icons-material/FilterList';
import { ThemeProvider } from '@mui/material/styles';
import useTablestyle from '../../../../hooks/useTablestyles';
import useToasterNotification from '../../../../hooks/useToasterNotification';
import { authAxios } from '../../../../axiosInstance';
import CustomBadgeWithIcon from '../../../../components/CustomComponent/BadgeWithIcon';
import { formatFiltersWithOptions, updateHiddenColumnsInLocalStorage } from '../../../../helpers/functions';
import useColumnHiding from '../../../../hooks/useColumnHiding';
import Avatar from '../../../../components/Avatar';
import ProfilePic from '../../../../assets/img/Noimages.png';
import Moments from '../../../../helpers/Moment';
import { debounceIntervalForTable, NoData, pageSizeOptions } from '../../../../helpers/constants';
import DeleteButton from '../../../../components/CustomComponent/Buttons/DeleteButton';
import StatusButton from '../../../../components/CustomComponent/Buttons/StatusButton';
import { exportData } from '../../../../helpers/exportData';
import Button from '../../../bootstrap/Button';
import { showConfirmationDialog } from '../../../../helpers/utils';
import DischargeTxnInfoShowModal from './DischargeTxnInfo';
const dummyDischargeTxnData = [
    {
        transaction_id: '1234567890',
        gtcc_no: '1234567890',
        name: 'GTCC Name',
        vehicle_no: 'Vehicle No',
        driver_name: 'Driver Name',
        entered_at: '2021-01-01',
        exited_at: '2021-01-01',
        total_collected_volume: '100',
        total_discharge_volume: '100',
        discharge_fee: '100',
        operator__full_name: 'Operator Name',
        operator_acceptance: 'Accepted',
        remarks: 'Remarks',
        vehicle_status: 'Active',
    },
    {
        transaction_id: '1234567890',
        gtcc_no: '1234567890',
        name: 'GTCC Name',
        vehicle_no: 'Vehicle No',
        driver_name: 'Driver Name',
        entered_at: '2021-01-01',
        exited_at: '2021-01-01',
        total_collected_volume: '100',
        total_discharge_volume: '100',
        discharge_fee: '100',
        operator__full_name: 'Operator Name',
        operator_acceptance: 'Accepted',
        remarks: 'Remarks',
        vehicle_status: 'Active',
    },
];

const DischargeTxnListComponent = (props) => {

    const canManageGTCC = true
    const { tableRef, date, activeTab, selectedItem, urlBackup, selectedStatuses } = props;
    const navigate = useNavigate();
    const [pageSize, setPageSize] = useState(5);
    const { showErrorNotification } = useToasterNotification();
    const [dischargeTxnInfoShowData, setDischargeTxnInfoShowData] = useState(null);
    const [dischargeTxnInfoShowModal, setDischargeTxnInfoShowModal] = useState(false);
    const { theme, rowStyles, headerStyles, searchFieldStyle } = useTablestyle();
    const [filterEnabled, setFilterEnabled] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const totalRecordsCount = useRef(0);


    const staticColumns = [
        {
            title: "Txn ID",
            field: "transaction_id",
            removable: false,
            render: (rowData) => (
                <>
                    {rowData.gtcc_no !== "" || rowData.gtcc_no !== null
                        ? rowData.gtcc_no
                        : NoData}
                </>
            ),
        },
        {
            title: "GTCC Name",
            field: "name",
            render: (rowData) => (
                <>{rowData.name ? rowData.name : NoData}</>
            ),
        },
        {
            title: "Assigned Vehicle",
            field: "vehicle_no",
            render: (rowData) => (
                <>{rowData.vehicle_no ? rowData.vehicle_no : NoData}</>
            ),
        },
        {
            title: "Driver",
            field: "driver_name",
            render: (rowData) => (
                <>{rowData.driver_name ? rowData.driver_name : NoData}</>
            ),
        },
        {
            title: "Entry Time",
            field: "entered_at",
            render: (rowData) => (
                <>{rowData.entered_at ? rowData.entered_at : NoData}</>
            ),
        },
        {
            title: "Exit Time",
            field: "exited_at",
            render: (rowData) => (
                <>{rowData.exited_at ? rowData.exited_at : NoData}</>
            ),
        },
        {
            title: "Total Gallons (SR)",
            field: "total_collected_volume",
            render: (rowData) => (
                <>{rowData.total_collected_volume ? rowData.total_collected_volume : NoData}</>
            ),
        },
        {
            title: "Total Gallons (Sensor)",
            field: "total_discharge_volume",
            render: (rowData) => (
                <>{rowData.total_discharge_volume ? rowData.total_discharge_volume : NoData}</>
            ),
        },
        {
            title: "Total Discharge Fee",
            field: 'discharge_fee',
            render: (rowData) => (
                <>{rowData.discharge_fee || NoData}</>
            ),
        },
        {
            title: "Operator",
            field: 'operator__full_name',
            render: (rowData) => (
                <>{rowData.operator__full_name ? rowData.operator__full_name : NoData}</>
            ),
        },
        {
            title: "Operator Acceptance",
            field: 'operator_acceptance',
            render: (rowData) => (
                <>{rowData?.operator_acceptance ? rowData?.operator_acceptance : NoData}</>
            ),
        },
        {
            title: "Remarks",
            field: 'remarks',
            render: (rowData) => (
                <>{rowData.remarks ? rowData.remarks : NoData}</>
            ),
        },
        {
            title: "Vehicle Status",
            field: 'vehicle_status',
            render: (rowData) => (
                <CustomBadgeWithIcon>{rowData.vehicle_status}</CustomBadgeWithIcon>
            ),
        },


    ];





    const columns = useColumnHiding({
        oldValue: staticColumns,
        hiddenColumnArray: JSON.parse(localStorage.getItem('GTTCList')) || [],
        buttonArray: []
    });


    useEffect(() => {
        if (initialLoading) {
            setInitialLoading(false);
            return;
        }
        tableRef.current.onQueryChange();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);
    const handleDownload = (rowData) => {
        console.log(rowData);
    }
    const HandlePostInvoiceToSAP = (id, method) => {
        console.log(id, method);
    }
    const HandleResendDORequest = (id) => {
        console.log(id);
    }
    return (
        <>
            {dischargeTxnInfoShowModal && <DischargeTxnInfoShowModal
                isOpen={dischargeTxnInfoShowModal}
                setIsOpen={setDischargeTxnInfoShowModal}
                dischargeTxnInfo={dischargeTxnInfoShowData}
            />}
            <div
                style={{
                    overflowY: 'auto',
                }}>
                <ThemeProvider theme={theme}>
                    <MaterialTable
                        title=' '
                        columns={columns}
                        tableRef={tableRef}

                        //@ts-ignore
                        onChangeRowsPerPage={(page) => setPageSize(page)}
                        // onRowClick={(event, rowData) => {
                        //   window.open(`/gtcc_management/gtcc/${rowData.id}`, '_blank')

                        // }}
                        onRowClick={(_, rowData) => {
                            navigate(`/gtcc_management/gtcc/${rowData.id}`)
                        }}

                        localization={{
                            pagination: {
                                labelRowsPerPage: '',
                            }
                        }}

                        onChangeColumnHidden={(column, hidden) =>
                            updateHiddenColumnsInLocalStorage(column, hidden, 'gtccManagementList')
                        }
                        data={(query) => {
                            return new Promise((resolve, reject) => {

                                return resolve({
                                    data: dummyDischargeTxnData,
                                    page: query.page,
                                    totalCount: dummyDischargeTxnData.length,
                                })
                                // let statusTypes = '&status__in=Active,Disabled,Completed,Yet to start';
                                // if (activeTab !== "All") {
                                //     statusTypes = `&status__in=${activeTab}`
                                // }

                                let orderBy = '';
                                const otherFilters = formatFiltersWithOptions(query.filters);
                                if (query.orderBy) {
                                    orderBy =
                                        query.orderDirection === 'asc'
                                            ? `&ordering=-${String(query.orderBy?.field)}`
                                            : `&ordering=${String(query.orderBy?.field)}`;
                                }

                                let url = `/region/gtccs?limit=${query.pageSize}&offset=${query.pageSize * query.page}&is_deleted=false&search=${query.search}${orderBy}&${otherFilters}`;
                                // Check if date range and selected item are defined
                                if (date && date?.selection?.startDateFilter && date?.selection?.endDateFilter && selectedItem) {
                                    // if (selectedItem.value === "created_at") {
                                    url += `&${selectedItem.startDateKey}=${date.selection.startDateFilter}&${selectedItem.endDateKey}=${date.selection.endDateFilter}`;
                                    // }
                                }
                                if (selectedStatuses.length > 0) {
                                    selectedStatuses.forEach(status => {
                                        url += `&status=${status}`;
                                    });
                                }
                                urlBackup.current = url;
                                authAxios
                                    .get(url)
                                    .then((response) => {
                                        totalRecordsCount.current = response.data?.count;
                                        resolve({
                                            data: response.data?.results,
                                            page: query.page,
                                            totalCount: response.data?.count,
                                        });
                                    })
                                    .catch((error) => {
                                        showErrorNotification(error);
                                        // eslint-disable-next-line prefer-promise-reject-errors
                                        resolve({
                                            data: [],
                                            page: query.page,
                                            totalCount: 0,
                                        });
                                    });
                            });
                        }}

                        actions={[
                            {
                                icon: FilterListIcon,
                                tooltip: filterEnabled ? 'Disable Filter' : 'Enable Filter',
                                isFreeAction: true,
                                onClick: () => {
                                    setFilterEnabled((state) => !state);
                                },
                            },
                            {
                                icon: () => <Button icon='Visibility' color='info' isLight size='sm' />,
                                tooltip: "Show Info",
                                onClick: (event, rowData) => {
                                    setDischargeTxnInfoShowModal(true);
                                    setDischargeTxnInfoShowData(rowData);
                                },
                                position: 'row'
                            },

                            (rowData) => ({
                                icon: () => <Button icon='Send' color='dark' isLight size='sm' />,
                                tooltip: "Resend DO Request",
                                onClick: (event, rowData) => {
                                    HandleResendDORequest(rowData.id)
                                },

                            }),
                            (rowData) => ({
                                icon: () => <Button icon='Download' color='info' isLight size='sm' />,
                                tooltip: "Download Delivery Order",
                                onClick: (event, rowData) =>
                                    handleDownload(rowData),
                            }),

                            rowData => ({
                                icon: () => <Button icon='Loop' color='primary' isLight size='sm' />,
                                tooltip: 'Post Invoice to SAP',
                                onClick: (event, rowData) => {
                                    HandlePostInvoiceToSAP(rowData.id, "Active")
                                },
                            }),

                        ]}
                        options={{
                            headerStyle: headerStyles(),
                            rowStyle: rowStyles(),
                            searchFieldStyle: searchFieldStyle(),
                            actionsColumnIndex: -1,
                            debounceInterval: debounceIntervalForTable,
                            filtering: filterEnabled,
                            pageSizeOptions: pageSizeOptions,
                            search: true,
                            pageSize,
                            columnsButton: true,
                            exportMenu: [{
                                label: 'Export as CSV',
                                exportFunc: () => exportData("csv", urlBackup.current, totalRecordsCount.current, 'GTCC List', JSON.parse(localStorage.getItem('gtccManagementList')) || [], columns)
                            },
                            ]
                        }}
                    />
                </ThemeProvider>
            </div>
        </>
    );
};
/* eslint-disable react/forbid-prop-types */
DischargeTxnListComponent.propTypes = {
    tableRef: PropTypes.object.isRequired,
    date: PropTypes.any,
    activeTab: PropTypes.string.isRequired,
    selectedItem: PropTypes.object.isRequired,
    urlBackup: PropTypes.any.isRequired,
    selectedStatuses: PropTypes.array.isRequired,

};
/* eslint-enable react/forbid-prop-types */

DischargeTxnListComponent.defaultProps = {
    date: null, // Default value
};
export default DischargeTxnListComponent;
