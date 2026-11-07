import React, { useState, useRef } from 'react'
import Card, { CardActions, CardBody, CardHeader, CardLabel, CardTitle } from '../../../../bootstrap/Card'
import { authAxios } from '../../../../../axiosInstance';
import { generateQueryParams, showConfirmationDialog, updateHiddenColumnsInLocalStorage } from '../../../../../helpers/utils';
import useTablestyle from '../../../../../hooks/useTablestyles';
import useToasterNotification from '../../../../../hooks/useToasterNotification';
import { ThemeProvider } from '@mui/material';
import MaterialTable from '@material-table/core';
import { useParams } from 'react-router-dom';
import { SubHeaderRight } from '../../../../../layout/SubHeader/SubHeader';
import AddButton from '../../../../CustomComponent/Buttons/AddButton';
import AddDocument from './AddDocument';
import Moments from '../../../../../helpers/Moment';
import useColumnHiding from '../../../../../hooks/useColumnHiding';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import useFetchUpdateDeleteHook from '../../../../../hooks/useFetchUpdateDeleteHook';
import EditDocument from './EditDocument';

function UserDocuments() {
	const { handleFetchUpdateDelete } = useFetchUpdateDeleteHook();
  const [pageSize, setPageSize] = useState(10);
  const tableRef = useRef(null);
  const { id } = useParams();
  const [addModalShow, setAddModalShow] = useState(false);
  const [editModalShow, setEditModalShow] = useState(false);
  const [itemToBeEdited, setItemToBeEdited] = useState(null);
  const { showErrorNotification } = useToasterNotification();
  const {theme,headerStyles,rowStyles,searchFieldStyle} = useTablestyle()
  const staticColumns = [
    {
      title: 'Document Number',
      field: 'document_number',
    },
    {
      title: 'Document Type',
      field: 'name',
	  render: (rowData) => {
		return rowData.document_type.name;
	  },
    },
	{
		title: 'Issued Date',
		field: 'issued_date',
		render: (rowData) => {
			return rowData.issued_date ? Moments(rowData.issued_date) : '';
		},
	},
	{
		title: 'Expiry Date',
		field: 'expiry_date',
		render: (rowData) => {
			return rowData.expiry_date ? Moments(rowData.expiry_date) : '';
		},
	},
    {
      title: 'Document File',
      field: 'document_file',
      render: (rowData) => {
        return rowData.document_file ? <a href={rowData.document_file} target='_blank'>View</a> : '';
      },
    },
  ]

  const columns = useColumnHiding({
	oldValue: staticColumns,
	hiddenColumnArray: JSON.parse(localStorage.getItem('userDocumentsList')) || [],
	buttonArray: [],
});



  return (
	<>
	{addModalShow && 
		<AddDocument
		isOpen={addModalShow}
		setIsOpen={setAddModalShow}
		title="Add Document"
		tableRef={tableRef}
    	/>
		}
	{editModalShow && 
		<EditDocument
		isOpen={editModalShow}
		setIsOpen={setEditModalShow}
		title="Edit Document"
		tableRef={tableRef}
		item={itemToBeEdited}
		/>
		}
    <Card stretch borderSize={2}>
    <CardHeader>
        <CardLabel icon='Contacts' iconColor='primary'>
            <CardTitle tag='div' className='h5'>
                User Documents
            </CardTitle>
        </CardLabel>
        <CardActions>
          <AddButton modalShow={setAddModalShow} name="Add New" />
        </CardActions>
    </CardHeader>
    <CardBody isScrollable>
    <div className='material-table-wrapper' style={{ overflow: 'auto' }}>
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
							onRowsPerPageChange={(page) => setPageSize(page)}
							// onRowClick={(event, rowData) => navigate(`/users/usermanagement/${rowData.id}`)}
							onChangeColumnHidden={(column, hidden) =>
								updateHiddenColumnsInLocalStorage(
									column,
									hidden,
									'userDocumentsList',
								)
							}
							data={(query) => {
								return new Promise((resolve, reject) => {
									const queryParams = generateQueryParams(query);

									let url = `/users/documents/?page_size=${query.pageSize}&page=${query.page + 1}&user=${id}&search=${query.search}${queryParams}`;
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
											// eslint-disable-next-line prefer-promise-reject-errors
											reject({
												data: [],
												page: query.page,
												totalCount: 0,
											});
										});
								});
							}}
							options={{
								headerStyle: headerStyles(),
								rowStyle: rowStyles(),
								actionsColumnIndex: -1,
								debounceInterval: 500,
								filtering: false,
								search: true,
								pageSize,
								columnsButton: true,
								searchFieldStyle: searchFieldStyle(),
							}}
							actions={[
							
								{
									icon: EditIcon,
									tooltip: 'Edit Document',
									onClick: (event, rowData) => {
										setItemToBeEdited(rowData);
										setEditModalShow(true);
									},
								},
								{
									icon: DeleteIcon,
									tooltip: 'Delete Document',
									onClick: (event, rowData) => {
										showConfirmationDialog('Are you sure?', 'You won\'t be able to revert this!', '', 'warning', 'Yes, delete it!')
										.then((result) => {
											if (result.isConfirmed) {
												const url = `/users/documents/${rowData.id}/`;
												const dataToBeSend = { status: 'Deleted' };
												let Message = 'Document Deleted Successfully';
												// @ts-ignore
												handleFetchUpdateDelete(url, dataToBeSend, '', 'delete', Message, '', tableRef);
											}
										});
									},
								},
							]}
						/>
					</ThemeProvider>
				</div>
      </CardBody>
    </Card>
</>
  )
}

export default UserDocuments