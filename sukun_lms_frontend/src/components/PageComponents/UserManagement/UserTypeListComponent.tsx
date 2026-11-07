import React, { useState, MutableRefObject, useEffect } from 'react';
import MaterialTable, { Column } from '@material-table/core';
import FilterListIcon from '@mui/icons-material/FilterList';
import { ThemeProvider } from '@mui/material/styles';
import { authAxios } from '../../../axiosInstance'; 
import useTablestyle from '../../../hooks/useTablestyles'; 
import useToasterNotification from '../../../hooks/useToasterNotification'; 
import { formatFilters, updateHiddenColumnsInLocalStorage } from '../../../helpers/functions'; 
import StatusButton from '../../CustomComponent/Buttons/StatusButton'; 
import DeleteButton from '../../CustomComponent/Buttons/DeleteButton'; 
import useColumnHiding from '../../../hooks/useColumnHiding'; 
export interface UserTypeListTableData { id: number; name: string; description?: string; status?: string; created_at?: string; }
interface UserTypeListComponentProps { tableRef: MutableRefObject<any>; activeTab: string; urlBackup: MutableRefObject<string>; }

const UserTypeListComponent: React.FC<UserTypeListComponentProps> = ({ tableRef, activeTab, urlBackup, }) => {
    const [pageSize, setPageSize] = useState<number>(5); 
    const { showErrorNotification } = useToasterNotification(); 
    const { theme, rowStyles, headerStyles,searchFieldStyle } = useTablestyle(); 
    const [filterEnabled, setFilterEnabled] = useState<boolean>(false); 
    const staticColumns: Column<UserTypeListTableData>[] = [{ title: 'Name', field: 'name', render: (rowData) => rowData?.name || '----', }, { title: 'Description', field: 'description', render: (rowData) => rowData?.description || '----', }, { title: 'Status', field: 'status', render: (rowData) => rowData?.status || '----', }, { title: 'Created On', field: 'created_at', render: (rowData) => rowData?.created_at || '----', },]; 
    const actionButtons: Column<UserTypeListTableData>[] = [{
        title: 'Actions',
        align: 'right',
        sorting: false,
        grouping: false,
        filtering: false,
        render: (rowData) => (
            <div className='d-flex gap-1 justify-content-end'>
                {rowData?.status && (
                    <StatusButton
                        status={rowData.status}
                        fieldKey='status'
                        tableRef={tableRef}
                        api={`api/user_management/user_types/${rowData.id}`}
                    />
                )}
                <DeleteButton
                    tableRef={tableRef}
                    apiEndpoint={`api/user_management/user_types/${rowData.id}`}
                    text=''
                />
            </div>
        ),
    },
    ];

    const columns = useColumnHiding({
        oldValue: staticColumns,
        //@ts-ignore
        hiddenColumnArray: JSON.parse(localStorage.getItem('userTypeList')) || [],
        buttonArray: actionButtons,
    });

    useEffect(() => {
        // TODO: Fetch user types from API based on activeTab
        // setData(fetchedData);
    }, [activeTab]);

    // Expose a method for parent to refresh data
    React.useImperativeHandle(tableRef, () => ({
        onQueryChange: () => {
            // TODO: Re-fetch data
        },
    }));

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
                    // @ts-ignore
                    onChangeRowsPerPage={(page) => setPageSize(page)}

                    // onChangeRowsPerPage={(page) => setPageSize(page)}
                    onChangeColumnHidden={(column, hidden) =>
                        updateHiddenColumnsInLocalStorage(column, hidden, 'userTypeList')
                    }
                    data={(query) =>
                        new Promise((resolve, reject) => {
                            const otherFilters = formatFilters(query.filters);
                            let orderBy = '';
                            if (query.orderBy) {
                                orderBy =
                                    query.orderDirection === 'asc'
                                        ? `&ordering=-${String(query.orderBy?.field)}`
                                        : `&ordering=${String(query.orderBy?.field)}`;
                            }
                            const statusFilter =
                                activeTab && activeTab !== 'All'
                                    ? `&status=${activeTab}`
                                    : '';
                            const url = `/user_management/user_types?limit=${query.pageSize}&offset=${query.pageSize * query.page
                                }&search=${query.search}${orderBy}${statusFilter}&${otherFilters}`;

                            urlBackup.current = url;

                            authAxios
                                .get(url)
                                .then((response) => {
                                    resolve({
                                        data: response.data?.results,
                                        page: query.page,
                                        totalCount: response.data?.count,
                                    });
                                })
                                .catch((error) => {
                                    showErrorNotification(error);
                                    reject({ data: [], page: query.page, totalCount: 0 });
                                });
                        })
                    }
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

export default UserTypeListComponent;