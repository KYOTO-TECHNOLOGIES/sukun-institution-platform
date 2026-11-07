import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageWrapper from '../../layout/PageWrapper/PageWrapper';
import Page from '../../layout/Page/Page';
import Card, { CardBody, CardHeader, CardTitle } from '../../components/bootstrap/Card';
import Button from '../../components/bootstrap/Button';
import FormGroup from '../../components/bootstrap/forms/FormGroup';
import Input from '../../components/bootstrap/forms/Input';
import Select from '../../components/bootstrap/forms/Select';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../components/bootstrap/Modal';
import { setBreadcrumbs, setHeaderTitle } from '../../store/uiSlice';
import { authAxios } from '../../axiosInstance';
import KyotoLoader from '../../components/KyotoLoader/KyotoLoader';
import useToasterNotification from '../../hooks/useToasterNotification';

const LibraryManagement = () => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const { showSuccessNotification, showErrorNotification } = useToasterNotification();

	const [activeTab, setActiveTab] = useState<'catalog' | 'issues'>('catalog');

	// Modals
	const [isBookModalOpen, setIsBookModalOpen] = useState(false);
	const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

	const [editingBook, setEditingBook] = useState<any>(null);

	// Form States
	const [bookForm, setBookForm] = useState({
		title: '',
		author: '',
		isbn: '',
		publisher: '',
		publication_year: new Date().getFullYear(),
		total_copies: 1,
		available_copies: 1,
		shelf_location: '',
	});

	const [issueForm, setIssueForm] = useState({
		book: '',
		borrower_type: 'STUDENT', // STUDENT | TEACHER
		borrower_id: '', // Student ID or User ID
		issue_date: new Date().toISOString().slice(0, 10),
		due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10), // 14 days
	});

	useEffect(() => {
		dispatch(setHeaderTitle({ name: 'Library System', isEditable: false }));
		dispatch(setBreadcrumbs([{ title: 'Dashboard', to: '/' }, { title: 'Library Catalog' }]));
	}, [dispatch]);

	// Fetch Library Books
	const { data: booksData, isLoading: loadingBooks } = useQuery({
		queryKey: ['library-books'],
		queryFn: () => authAxios.get('/api/library/library-books/').then((res) => res.data),
	});

	// Fetch Book Issues
	const { data: issuesData, isLoading: loadingIssues } = useQuery({
		queryKey: ['book-issues'],
		queryFn: () => authAxios.get('/api/library/book-issues/').then((res) => res.data),
	});

	// Fetch Students
	const { data: studentsData } = useQuery({
		queryKey: ['students'],
		queryFn: () => authAxios.get('/api/students/students/').then((res) => res.data),
	});

	// Fetch Teachers
	const { data: teachersData } = useQuery({
		queryKey: ['teachers'],
		queryFn: () => authAxios.get('/api/staff/teachers/').then((res) => res.data),
	});

	// Fetch Users (for teacher names)
	const { data: usersData } = useQuery({
		queryKey: ['users'],
		queryFn: () => authAxios.get('/api/accounts/users/').then((res) => res.data),
	});

	// Fetch Institutions
	const { data: institutionsData } = useQuery({
		queryKey: ['institutions'],
		queryFn: () => authAxios.get('/api/institutions/institutions/').then((res) => res.data),
	});

	// Mutations
	const saveBookMutation = useMutation({
		mutationFn: (data: any) => {
			const instId = institutionsData?.results?.[0]?.id || institutionsData?.[0]?.id;
			const payload = {
				...data,
				total_copies: parseInt(data.total_copies) || 1,
				available_copies: parseInt(data.available_copies) || 1,
				publication_year: parseInt(data.publication_year) || new Date().getFullYear(),
				institution: instId,
			};
			if (editingBook) {
				return authAxios.patch(`/api/library/library-books/${editingBook.id}/`, payload);
			}
			return authAxios.post('/api/library/library-books/', payload);
		},
		onSuccess: () => {
			showSuccessNotification(editingBook ? 'Book details updated' : 'Book added to catalog');
			queryClient.invalidateQueries({ queryKey: ['library-books'] });
			setIsBookModalOpen(false);
			resetBookForm();
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const issueBookMutation = useMutation({
		mutationFn: async (data: any) => {
			const payload: any = {
				book: data.book,
				issue_date: data.issue_date,
				due_date: data.due_date,
				status: 'ISSUED',
			};

			if (data.borrower_type === 'STUDENT') {
				payload.student = data.borrower_id;
			} else {
				payload.teacher = data.borrower_id;
			}

			// Issue the book
			const issueRes = await authAxios.post('/api/library/book-issues/', payload);

			// Decrease available copies in the catalog
			const targetBook = books.find((b: any) => b.id === data.book);
			if (targetBook) {
				const currentAvailable = targetBook.available_copies || 0;
				await authAxios.patch(`/api/library/library-books/${data.book}/`, {
					available_copies: currentAvailable > 0 ? currentAvailable - 1 : 0,
				});
			}

			return issueRes;
		},
		onSuccess: () => {
			showSuccessNotification('Book issued successfully');
			queryClient.invalidateQueries({ queryKey: ['book-issues'] });
			queryClient.invalidateQueries({ queryKey: ['library-books'] });
			setIsIssueModalOpen(false);
			resetIssueForm();
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const returnBookMutation = useMutation({
		mutationFn: async (issueLog: any) => {
			// Update status in issues
			const payload = {
				return_date: new Date().toISOString().slice(0, 10),
				status: 'RETURNED',
			};
			const retRes = await authAxios.patch(`/api/library/book-issues/${issueLog.id}/`, payload);

			// Increase available copies in the catalog
			const targetBook = books.find((b: any) => b.id === issueLog.book);
			if (targetBook) {
				const currentAvailable = targetBook.available_copies || 0;
				await authAxios.patch(`/api/library/library-books/${issueLog.book}/`, {
					available_copies: currentAvailable + 1,
				});
			}

			return retRes;
		},
		onSuccess: () => {
			showSuccessNotification('Book returned successfully');
			queryClient.invalidateQueries({ queryKey: ['book-issues'] });
			queryClient.invalidateQueries({ queryKey: ['library-books'] });
		},
		onError: (err: any) => showErrorNotification(err),
	});

	const resetBookForm = () => {
		setBookForm({
			title: '',
			author: '',
			isbn: '',
			publisher: '',
			publication_year: new Date().getFullYear(),
			total_copies: 1,
			available_copies: 1,
			shelf_location: '',
		});
		setEditingBook(null);
	};

	const resetIssueForm = () => {
		const bookId = booksData?.results?.[0]?.id || booksData?.[0]?.id || '';
		setIssueForm({
			book: bookId,
			borrower_type: 'STUDENT',
			borrower_id: '',
			issue_date: new Date().toISOString().slice(0, 10),
			due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
		});
	};

	const handleOpenCreateBook = () => {
		resetBookForm();
		setIsBookModalOpen(true);
	};

	const handleOpenEditBook = (book: any) => {
		setEditingBook(book);
		setBookForm({
			title: book.title || '',
			author: book.author || '',
			isbn: book.isbn || '',
			publisher: book.publisher || '',
			publication_year: book.publication_year || new Date().getFullYear(),
			total_copies: book.total_copies || 1,
			available_copies: book.available_copies || 1,
			shelf_location: book.shelf_location || '',
		});
		setIsBookModalOpen(true);
	};

	const handleOpenIssue = () => {
		resetIssueForm();
		setIsIssueModalOpen(true);
	};

	if (loadingBooks || loadingIssues) {
		return <KyotoLoader />;
	}

	const books = booksData?.results || booksData || [];
	const issues = issuesData?.results || issuesData || [];
	const students = studentsData?.results || studentsData || [];
	const teachers = teachersData?.results || teachersData || [];
	const users = usersData?.results || usersData || [];

	const getStudentName = (id: string) => {
		const found = students.find((s: any) => s.id === id);
		return found ? found.full_name || found.user_name : '-';
	};

	const getTeacherNameByProfileId = (profileId: string) => {
		const teacherProfile = teachers.find((t: any) => t.id === profileId);
		if (!teacherProfile) return '-';
		const uObj = users.find((u: any) => u.id === teacherProfile.user);
		return uObj ? `${uObj.first_name || uObj.username} ${uObj.last_name || ''}` : 'Teacher';
	};

	const getBookTitle = (id: string) => {
		const found = books.find((b: any) => b.id === id);
		return found ? found.title : '-';
	};

	return (
		<PageWrapper>
			<Page>
				{/* Tabs */}
				<div className='row mb-4'>
					<div className='col-12'>
						<ul className='nav nav-pills'>
							<li className='nav-item me-2'>
								<button
									className={`nav-link ${activeTab === 'catalog' ? 'active' : ''}`}
									onClick={() => setActiveTab('catalog')}>
									Books Catalog
								</button>
							</li>
							<li className='nav-item'>
								<button
									className={`nav-link ${activeTab === 'issues' ? 'active' : ''}`}
									onClick={() => setActiveTab('issues')}>
									Issue / Return Logs
								</button>
							</li>
						</ul>
					</div>
				</div>

				<div className='row'>
					<div className='col-12'>
						{activeTab === 'catalog' && (
							<Card>
								<CardHeader>
									<CardTitle>Library Catalog</CardTitle>
									<div className='d-flex gap-2'>
										<Button color='light' icon='ImportContacts' onClick={handleOpenIssue}>
											Issue Book
										</Button>
										<Button color='primary' icon='Add' onClick={handleOpenCreateBook}>
											Add Book
										</Button>
									</div>
								</CardHeader>
								<CardBody className='table-responsive'>
									<table className='table table-modern table-hover'>
										<thead>
											<tr>
												<th>Title</th>
												<th>Author</th>
												<th>ISBN</th>
												<th>Shelf</th>
												<th>Total Copies</th>
												<th>Available</th>
												<th className='text-end'>Actions</th>
											</tr>
										</thead>
										<tbody>
											{books.map((b: any) => (
												<tr key={b.id}>
													<td><strong>{b.title}</strong></td>
													<td>{b.author}</td>
													<td><code>{b.isbn || '-'}</code></td>
													<td>{b.shelf_location || '-'}</td>
													<td>{b.total_copies}</td>
													<td>
														<span className={`badge bg-${b.available_copies > 0 ? 'success' : 'danger'}`}>
															{b.available_copies} available
														</span>
													</td>
													<td className='text-end'>
														<Button
															color='info'
															size='sm'
															icon='Edit'
															onClick={() => handleOpenEditBook(b)}>
															Edit
														</Button>
													</td>
												</tr>
											))}
											{books.length === 0 && (
												<tr>
													<td colSpan={7} className='text-center text-muted'>
														No books in the catalog.
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</CardBody>
							</Card>
						)}

						{activeTab === 'issues' && (
							<Card>
								<CardHeader>
									<CardTitle>Borrowing Logs</CardTitle>
								</CardHeader>
								<CardBody className='table-responsive'>
									<table className='table table-modern table-hover'>
										<thead>
											<tr>
												<th>Book Title</th>
												<th>Borrower</th>
												<th>Issue Date</th>
												<th>Due Date</th>
												<th>Return Date</th>
												<th>Status</th>
												<th className='text-end'>Actions</th>
											</tr>
										</thead>
										<tbody>
											{issues.map((log: any) => (
												<tr key={log.id}>
													<td><strong>{getBookTitle(log.book)}</strong></td>
													<td>
														{log.student ? (
															<span>Student: {getStudentName(log.student)}</span>
														) : (
															<span>Staff: {getTeacherNameByProfileId(log.teacher)}</span>
														)}
													</td>
													<td>{log.issue_date}</td>
													<td>{log.due_date}</td>
													<td>{log.return_date || '-'}</td>
													<td>
														<span className={`badge bg-${log.status === 'RETURNED' ? 'success' : log.status === 'OVERDUE' ? 'danger' : 'warning'}`}>
															{log.status}
														</span>
													</td>
													<td className='text-end'>
														{log.status === 'ISSUED' && (
															<Button
																color='success'
																size='sm'
																icon='AssignmentReturn'
																onClick={() => returnBookMutation.mutate(log)}
																isDisable={returnBookMutation.isPending}>
																Mark Returned
															</Button>
														)}
													</td>
												</tr>
											))}
											{issues.length === 0 && (
												<tr>
													<td colSpan={7} className='text-center text-muted'>
														No books issued yet.
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</CardBody>
							</Card>
						)}
					</div>
				</div>

				{/* 1. Add/Edit Book Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isBookModalOpen} setIsOpen={setIsBookModalOpen} size='lg'>
					<form onSubmit={(e) => { e.preventDefault(); saveBookMutation.mutate(bookForm); }}>
						<ModalHeader>
							<ModalTitle id='book-modal-title'>{editingBook ? 'Edit Book Details' : 'Add Book'}</ModalTitle>
						</ModalHeader>
						<ModalBody>
							<div className='row g-4'>
								<div className='col-md-6'>
									<FormGroup label='Book Title'>
										<Input
											value={bookForm.title}
											onChange={(e: any) => setBookForm({ ...bookForm, title: e.target.value })}
											required
											placeholder='e.g. Mukhtasar al-Quduri'
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Author'>
										<Input
											value={bookForm.author}
											onChange={(e: any) => setBookForm({ ...bookForm, author: e.target.value })}
											required
											placeholder='e.g. Imam al-Quduri'
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='ISBN'>
										<Input
											value={bookForm.isbn}
											onChange={(e: any) => setBookForm({ ...bookForm, isbn: e.target.value })}
											placeholder='e.g. 978-3-16-148410-0'
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Publisher'>
										<Input
											value={bookForm.publisher}
											onChange={(e: any) => setBookForm({ ...bookForm, publisher: e.target.value })}
											placeholder='e.g. Dar Al Kotob Al Ilmiyah'
										/>
									</FormGroup>
								</div>
								<div className='col-md-4'>
									<FormGroup label='Publication Year'>
										<Input
											type='number'
											value={bookForm.publication_year}
											onChange={(e: any) => setBookForm({ ...bookForm, publication_year: parseInt(e.target.value) || new Date().getFullYear() })}
										/>
									</FormGroup>
								</div>
								<div className='col-md-4'>
									<FormGroup label='Total Copies'>
										<Input
											type='number'
											min={1}
											value={bookForm.total_copies}
											onChange={(e: any) => setBookForm({
												...bookForm,
												total_copies: parseInt(e.target.value) || 1,
												available_copies: editingBook ? bookForm.available_copies : parseInt(e.target.value) || 1,
											})}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-md-4'>
									<FormGroup label='Shelf Location'>
										<Input
											value={bookForm.shelf_location}
											onChange={(e: any) => setBookForm({ ...bookForm, shelf_location: e.target.value })}
											placeholder='e.g. Row 3, Shelf B'
										/>
									</FormGroup>
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setIsBookModalOpen(false)}>Cancel</Button>
							<Button color='primary' type='submit' isDisable={saveBookMutation.isPending}>Save</Button>
						</ModalFooter>
					</form>
				</Modal>

				{/* 2. Issue Book Modal */}
				{/* @ts-ignore */}
				<Modal isOpen={isIssueModalOpen} setIsOpen={setIsIssueModalOpen} size='lg'>
					<form onSubmit={(e) => { e.preventDefault(); issueBookMutation.mutate(issueForm); }}>
						<ModalHeader><ModalTitle id='issue-modal-title'>Issue Book</ModalTitle></ModalHeader>
						<ModalBody>
							<div className='row g-4'>
								<div className='col-12'>
									<FormGroup label='Select Book'>
										<Select
											ariaLabel='Select Book'
											value={issueForm.book}
											onChange={(e: any) => setIssueForm({ ...issueForm, book: e.target.value })}
											required>
											<option value=''>Select Book</option>
											{books.filter((b: any) => b.available_copies > 0).map((b: any) => (
												<option key={b.id} value={b.id}>
													{b.title} (By {b.author}) - {b.available_copies} available
												</option>
											))}
										</Select>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Borrower Type'>
										<Select
											ariaLabel='Borrower Type'
											value={issueForm.borrower_type}
											onChange={(e: any) => setIssueForm({ ...issueForm, borrower_type: e.target.value, borrower_id: '' })}
											required>
											<option value='STUDENT'>Student</option>
											<option value='TEACHER'>Teacher / Staff</option>
										</Select>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Select Borrower'>
										<Select
											ariaLabel='Select Borrower'
											value={issueForm.borrower_id}
											onChange={(e: any) => setIssueForm({ ...issueForm, borrower_id: e.target.value })}
											required>
											<option value=''>Select Borrower Account</option>
											{issueForm.borrower_type === 'STUDENT' ? (
												students.map((st: any) => (
													<option key={st.id} value={st.id}>
														{st.full_name || st.user_name} ({st.admission_number})
													</option>
												))
											) : (
												teachers.map((t: any) => (
													<option key={t.id} value={t.id}>
														{getTeacherNameByProfileId(t.id)} ({t.employee_id})
													</option>
												))
											)}
										</Select>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Issue Date'>
										<Input
											type='date'
											value={issueForm.issue_date}
											onChange={(e: any) => setIssueForm({ ...issueForm, issue_date: e.target.value })}
											required
										/>
									</FormGroup>
								</div>
								<div className='col-md-6'>
									<FormGroup label='Due Date'>
										<Input
											type='date'
											value={issueForm.due_date}
											onChange={(e: any) => setIssueForm({ ...issueForm, due_date: e.target.value })}
											required
										/>
									</FormGroup>
								</div>
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='light' onClick={() => setIsIssueModalOpen(false)}>Cancel</Button>
							<Button color='primary' type='submit' isDisable={issueBookMutation.isPending}>Issue Book</Button>
						</ModalFooter>
					</form>
				</Modal>
			</Page>
		</PageWrapper>
	);
};

export default LibraryManagement;
