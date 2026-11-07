import React, { useState, MutableRefObject } from 'react';
import MaterialTable, { Column } from '@material-table/core';
import FilterListIcon from '@mui/icons-material/FilterList';
import { ThemeProvider } from '@mui/material/styles';
import useTablestyle from '../../../../hooks/useTablestyles';
import useToasterNotification from '../../../../hooks/useToasterNotification';
import {  updateHiddenColumnsInLocalStorage } from '../../../../helpers/functions';
import DeleteButton from '../../../CustomComponent/Buttons/DeleteButton';
import useColumnHiding from '../../../../hooks/useColumnHiding';
import StatusButton from '../../../CustomComponent/Buttons/StatusButton';

export interface ContractListTableData {
    id:number;
  entity_no?: string;
  entity?: string;
  tl_no?: string;
  gtcc_no?: string;
  gtcc?: string;
  category?: string;
  sub_category?: string;
  area?: string;
  subarea?: string;
  zone?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  requested_on?: string;
  status?: string;
  rejection_reason?: string;
}






interface ContractListTableProps {
    tableRef: MutableRefObject<any>;
    urlBackup: MutableRefObject<string>;
    editModalToggle?: (id: any) => void;
}

const ContractListTable: React.FC<ContractListTableProps> = ({
    tableRef,
    urlBackup,
    editModalToggle
}) => {
    const canManageBuilding = true;
    const [pageSize, setPageSize] = useState<number>(5);
    const { showErrorNotification } = useToasterNotification();
    const { theme, rowStyles, headerStyles,searchFieldStyle } = useTablestyle();
    const [filterEnabled, setFilterEnabled] = useState<boolean>(false);


    const staticColumns: Column<ContractListTableData>[] = [
        {
        title: 'Entity No',
        field: 'entity_no',
        render: (rowData) => rowData?.entity_no || '----',
    },
    {
        title: 'Entity',
        field: 'entity',
        render: (rowData) => rowData?.entity || '----',
    },
    {
        title: 'TL No',
        field: 'tl_no',
        render: (rowData) => rowData?.tl_no || '----',
    },
    {
        title: 'GTCC No',
        field: 'gtcc_no',
        render: (rowData) => rowData?.gtcc_no || '----',
    },
    {
        title: 'GTCC',
        field: 'gtcc',
        render: (rowData) => rowData?.gtcc || '----',
    },
    {
        title: 'Category',
        field: 'category',
        render: (rowData) => rowData?.category || '----',
    },
    {
        title: 'Sub Category',
        field: 'sub_category',
        render: (rowData) => rowData?.sub_category || '----',
    },
    {
        title: 'Area',
        field: 'area',
        render: (rowData) => rowData?.area || '----',
    },
    {
        title: 'Subarea',
        field: 'subarea',
        render: (rowData) => rowData?.subarea || '----',
    },
    {
        title: 'Zone',
        field: 'zone',
        render: (rowData) => rowData?.zone || '----',
    },
    {
        title: 'Contract Start Date',
        field: 'contract_start_date',
        render: (rowData) => rowData?.contract_start_date || '----',
    },
    {
        title: 'Contract End Date',
        field: 'contract_end_date',
        render: (rowData) => rowData?.contract_end_date || '----',
    },
    {
        title: 'Requested On',
        field: 'requested_on',
        render: (rowData) => rowData?.requested_on || '----',
    },
     {
        title: 'Status',
        field: 'status',
        render: (rowData) => rowData?.status || '----',
    },
     {
        title: 'Rejection Reason',
        field: 'rejection_reason',
        render: (rowData) => rowData?.rejection_reason || '----',
    }

    ];

    const actionButtons: Column<ContractListTableData>[] = canManageBuilding
        ? [
            {
                title: 'Actions',
                align: 'right',
                sorting: false,
                grouping: false,
                filtering: false,
                render: (rowData) => (
                    <div className='d-flex gap-1 justify-content-end'>
                        {rowData?.status &&
                            <StatusButton
                                status={rowData.status}
                                fieldKey='status'
                                tableRef={tableRef}
                                api={`api/buildings/${rowData.id}`}
                            />}
                        <DeleteButton
                            tableRef={tableRef}
                            apiEndpoint={`api/buildings/${rowData.id}`}
                            text=''
                        />
                    </div>
                ),
            },
        ]
        : [];

 const columns = useColumnHiding({
        oldValue: staticColumns,
        //@ts-ignore
        hiddenColumnArray: JSON.parse(localStorage.getItem('contractList')) || [],
        buttonArray: actionButtons,
    });


    return (
        <div className='material-table-wrapper'>
            <ThemeProvider theme={theme}>
                <MaterialTable
                    title=' '
                    columns={columns}
                    tableRef={tableRef}
                    localization={{
                        pagination: {
                          labelRowsPerPage: '',
                        }
                      }}
                    //@ts-ignore
                    onChangeRowsPerPage={(page) => setPageSize(page)}
                    // onRowClick={(event, rowData) => naviagte(`/tripmanagement/tripschedule/${rowData.id}`)}

                    onChangeColumnHidden={(column, hidden) =>
                        updateHiddenColumnsInLocalStorage(column, hidden, 'contractList')
                    }
                    // data={(query) =>
                    //     new Promise((resolve, reject) => {
                    //         const otherFilters = formatFilters(query.filters);
                    //         let orderBy = '';
                    //         if (query.orderBy) {
                    //             orderBy =
                    //                 query.orderDirection === 'asc'
                    //                     ? `&ordering=-${String(query.orderBy?.field)}`
                    //                     : `&ordering=${String(query.orderBy?.field)}`;
                    //         }
                    //         const url = `/api/buildings?limit=${query.pageSize}&offset=${query.pageSize * query.page
                    //             }&search=${query.search}${orderBy}&${otherFilters}`;

                    //         urlBackup.current = url;

                    //         authAxios
                    //             .get(url)
                    //             .then((response) => {
                    //                 resolve({
                    //                     data: response.data?.results,
                    //                     page: query.page,
                    //                     totalCount: response.data?.count,
                    //                 });
                    //             })
                    //             .catch((error) => {
                    //                 showErrorNotification(error);
                    //                 reject({ data: [], page: query.page, totalCount: 0 });
                    //             });
                    //     })
                    
                    // }

                    data={[]}
                    options={{
                        headerStyle: headerStyles(),
                        rowStyle: rowStyles(),
                        searchFieldStyle:searchFieldStyle(),
                        actionsColumnIndex: -1,
                        debounceInterval: 500,
                        filtering: filterEnabled,
                        search: true,
                        pageSize,
                        columnsButton: true,

                    }}
                    actions={[
                        {
                            icon: FilterListIcon,
                            tooltip: filterEnabled ? 'Disable Filter' : 'Enable Filter',
                            isFreeAction: true,
                            onClick: () => setFilterEnabled((state) => !state),
                        },
                    ]}
                />
            </ThemeProvider>
        </div>
    );
};

export default ContractListTable;
