import React, { useState, useEffect, useRef, FC } from 'react';
import { Form } from 'reactstrap';
import { useForm } from 'react-hook-form';
import { authAxios } from '../../../axiosInstance';
import OffCanvasComponent from '../../../components/OffCanvasComponent';
import Card, { CardBody } from '../../../components/bootstrap/Card';
import SaveButton from '../../../components/CustomComponent/Buttons/SaveButton';
import useToasterNotification from '../../../hooks/useToasterNotification';
import CustomSpinner from '../../../components/CustomSpinner/CustomSpinner';
import Fields, { resolveRoleOption, type UserRoleSelectOption } from './Fields';

interface EditUserProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	tableRef: React.RefObject<{ onQueryChange: () => void } | null>;
	title: string;
	id: number;
}

type EditUserFormValues = {
	first_name: string;
	last_name: string;
	email: string;
	role: UserRoleSelectOption | null;
};

const EditUser: FC<EditUserProps> = ({ isOpen, setIsOpen, tableRef, id, title }) => {
	const { showErrorNotification, showSuccessNotification } = useToasterNotification();
	const showErrorRef = useRef(showErrorNotification);
	showErrorRef.current = showErrorNotification;

	const {
		register,
		handleSubmit,
		reset,
		getValues,
		control,
		formState: { errors },
		trigger,
	} = useForm<EditUserFormValues>();

	const [waitingForAxios, setwaitingForAxios] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [roleOptions, setRoleOptions] = useState<UserRoleSelectOption[]>([]);
	const [roleOptionsLoading, setRoleOptionsLoading] = useState(false);
	const loadedUserIdRef = useRef<number | null>(null);

	/** Fetch available roles whenever the offcanvas opens. */
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

	/** Fetch the specific user's current data to pre-fill the form. */
	useEffect(() => {
		if (!isOpen || !id) {
			loadedUserIdRef.current = null;
			return;
		}
		if (loadedUserIdRef.current === id) return;

		let cancelled = false;
		setIsLoading(true);
		authAxios
			.get(`api/users/${id}/`)
			.then((res) => {
				if (cancelled) return;
				const data = res.data;
				reset({
					first_name: data.first_name ?? '',
					last_name: data.last_name ?? '',
					email: data.email ?? '',
					role: resolveRoleOption(data.role),
				});
				loadedUserIdRef.current = id;
			})
			.catch((err) => {
				if (!cancelled) showErrorRef.current(err);
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [id, isOpen]);

	useEffect(() => {
		if (!isOpen) {
			loadedUserIdRef.current = null;
		}
	}, [isOpen]);

	const onSubmit = (data: EditUserFormValues) => {
		const payload: Record<string, string | number> = {
			first_name: data.first_name.trim(),
			last_name: data.last_name.trim(),
			email: data.email.trim(),
			role_id: data.role!.value,
		};

		setwaitingForAxios(true);
		authAxios
			.put(`api/users/${id}/`, payload)
			.then((res) => {
				setwaitingForAxios(false);
				tableRef?.current?.onQueryChange?.();
				showSuccessNotification(res.data?.message || 'User updated successfully.');
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
						{isLoading ? (
							<CustomSpinner />
						) : (
							<>
								<Fields
									register={register}
									errors={errors}
									getValues={getValues}
									control={control}
									trigger={trigger}
									edit
									roleOptions={roleOptions}
									roleOptionsLoading={roleOptionsLoading}
								/>
								<div className='row m-0'>
									<div className='col-12 p-3'>
										<SaveButton state={waitingForAxios} />
									</div>
								</div>
							</>
						)}
					</CardBody>
				</Card>
			</Form>
		</OffCanvasComponent>
	);
};

export default EditUser;
