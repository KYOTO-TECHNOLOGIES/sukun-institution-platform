import React, { FC, useEffect, useRef, useState } from 'react';
import { Form } from 'reactstrap';
import { useForm } from 'react-hook-form';
import { authAxios } from '../../../axiosInstance';
import OffCanvasComponent from '../../OffCanvasComponent';
import Card, { CardBody } from '../../bootstrap/Card';
import SaveButton from '../../CustomComponent/Buttons/SaveButton';
import useToasterNotification from '../../../hooks/useToasterNotification';
import Fields, { type UserRoleSelectOption } from './Fields';

interface AddUserProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	tableRef: React.RefObject<{ onQueryChange: () => void } | null>;
	title: string;
}

type AddUserFormValues = {
	first_name: string;
	last_name: string;
	email: string;
	role: UserRoleSelectOption | null;
	password: string;
	password2: string;
};

const AddUser: FC<AddUserProps> = ({ isOpen, setIsOpen, tableRef, title }) => {
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();
	const showErrorRef = useRef(showErrorNotification);
	showErrorRef.current = showErrorNotification;

	const {
		register,
		handleSubmit,
		getValues,
		control,
		reset,
		formState: { errors },
		trigger,
	} = useForm<AddUserFormValues>({
		defaultValues: {
			first_name: '',
			last_name: '',
			email: '',
			role: null,
			password: '',
			password2: '',
		},
	});

	const [waitingForAxios, setwaitingForAxios] = useState(false);
	const [roleOptions, setRoleOptions] = useState<UserRoleSelectOption[]>([]);
	const [roleOptionsLoading, setRoleOptionsLoading] = useState(false);

	useEffect(() => {
		if (!isOpen) return;

		setRoleOptionsLoading(true);
		authAxios
			.get('api/users/roles/')
			.then((res) => {
				const results: any[] = res.data?.results ?? res.data ?? [];
				setRoleOptions(
					Array.isArray(results)
						? results.map((r) => ({ label: r.name, value: r.id }))
						: [],
				);
			})
			.catch((err) => showErrorRef.current(err))
			.finally(() => setRoleOptionsLoading(false));
	}, [isOpen]);

	const onSubmit = (data: AddUserFormValues) => {
		const payload = {
			email: data.email.trim(),
			first_name: data.first_name.trim(),
			last_name: data.last_name.trim(),
			role_id: data.role?.value ?? undefined,
			password: data.password,
			password2: data.password2,
		};

		setwaitingForAxios(true);
		authAxios
			.post('/api/users/', payload)
			.then((res) => {
				setwaitingForAxios(false);
				tableRef?.current?.onQueryChange?.();
				showSuccessNotification(res.data?.message || 'User created successfully.');
				reset();
				setIsOpen(false);
			})
			.catch((err) => {
				setwaitingForAxios(false);
				showErrorNotification(err);
			});
	};

	return (
		<OffCanvasComponent isOpen={isOpen} placement='end' title={title} setOpen={setIsOpen}>
			<Form onSubmit={handleSubmit(onSubmit)}>
				<Card>
					<CardBody>
						<Fields
							register={register}
							errors={errors}
							getValues={getValues}
							control={control}
							trigger={trigger}
							roleOptions={roleOptions}
							roleOptionsLoading={roleOptionsLoading}
						/>
						<div className='row m-0'>
							<div className='col-12 p-3'>
								<SaveButton state={waitingForAxios} />
							</div>
						</div>
					</CardBody>
				</Card>
			</Form>
		</OffCanvasComponent>
	);
};

export default AddUser;
