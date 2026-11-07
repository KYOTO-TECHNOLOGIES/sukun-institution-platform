import React, { type FormEvent } from 'react';
import type { CreateTokenPayload, Queue, QueueSchedule, ServingPoint } from '../../../services/queueManagementApi';
import Button from '../../bootstrap/Button';

export interface TokenCreateFormProps {
	tokenForm: CreateTokenPayload;
	setTokenForm: React.Dispatch<React.SetStateAction<CreateTokenPayload>>;
	queues: Queue[];
	/** Schedules for the currently selected queue (used to pick `schedule_id`). */
	schedules: QueueSchedule[];
	selectedQueueId: number;
	onQueueChange: (queueId: number) => void;
	/** When set, the schedule is fixed (e.g. schedule detail page) and the schedule dropdown is hidden. */
	fixedScheduleId?: number;
	/** Serving points on the queue — shown as a reference list when creating a token. */
	servingPoints?: ServingPoint[];
	showServingPoints?: boolean;
	onCancel?: () => void;
	onSubmit: (e: FormEvent<HTMLFormElement>) => void;
	isSubmitting: boolean;
	/** Primary action label (default: Create Token). */
	submitLabel?: string;
	/** Show token number field (create mode on schedule detail). */
	showTokenNumber?: boolean;
	/** Loading state while fetching next token number. */
	tokenNumberLoading?: boolean;
}

const TokenCreateForm: React.FC<TokenCreateFormProps> = ({
	tokenForm,
	setTokenForm,
	queues,
	schedules,
	selectedQueueId,
	onQueueChange,
	fixedScheduleId,
	servingPoints,
	showServingPoints = true,
	onCancel,
	onSubmit,
	isSubmitting,
	submitLabel = 'Create Token',
	showTokenNumber = false,
	tokenNumberLoading = false,
}) => {
	const scheduleOptions =
		fixedScheduleId != null
			? schedules.filter((s) => s.id === fixedScheduleId)
			: schedules.filter((s) => s.queue === selectedQueueId);

	return (
	<form onSubmit={onSubmit} className='row g-3'>
		{showTokenNumber && (
			<div className='col-md-6'>
				<label className='form-label'>Token Number</label>
				<div className='input-group'>
					<input
						className={`form-control${tokenForm.token_number != null && Number(tokenForm.token_number) >= 1000 ? ' is-invalid' : ''}`}
						type='number'
						min='1'
						max='999'
						placeholder={tokenNumberLoading ? 'Loading…' : 'Token number'}
						disabled={tokenNumberLoading}
						value={tokenForm.token_number ?? ''}
						onChange={(e) =>
							setTokenForm((p) => ({
								...p,
								token_number: e.target.value === '' ? undefined : Number(e.target.value),
							}))
						}
					/>
					{tokenNumberLoading && (
						<span className='input-group-text'>
							<span className='spinner-border spinner-border-sm' />
						</span>
					)}
					{tokenForm.token_number != null && Number(tokenForm.token_number) >= 1000 && (
						<div className='invalid-feedback'>Token number must be less than 1000.</div>
					)}
				</div>
			</div>
		)}
		{fixedScheduleId == null && (
				<div className='col-md-6'>
					<label className='form-label'>Queue</label>
					<select
						className='form-select'
						required
						value={selectedQueueId || ''}
						onChange={(e) => {
							const q = Number(e.target.value);
							onQueueChange(q);
						}}>
						<option value=''>Select queue</option>
						{queues.map((queue) => (
							<option value={queue.id} key={queue.id}>
								{queue.name}
							</option>
						))}
					</select>
				</div>
			)}
			{fixedScheduleId == null && (
				<div className='col-md-6'>
					<label className='form-label'>Schedule</label>
					<select
						className='form-select'
						required
						value={tokenForm.schedule_id || ''}
						onChange={(e) =>
							setTokenForm((p) => ({ ...p, schedule_id: Number(e.target.value) }))
						}>
						<option value=''>Select schedule</option>
						{scheduleOptions.map((s) => (
							<option value={s.id} key={s.id}>
								{s.description?.trim() || `${s.queue_name ?? 'Queue'} · ${s.from_datetime?.slice(0, 16) ?? s.id}`}
							</option>
						))}
					</select>
					{selectedQueueId > 0 && !scheduleOptions.length && (
						<div className='form-text text-warning'>
							No schedules for this queue. Create a schedule on the queue detail page first.
						</div>
					)}
				</div>
			)}
			<div className='col-md-6'>
				<label className='form-label'>Customer Name</label>
				<input
					className='form-control'
					required
					value={tokenForm.name}
					onChange={(e) => setTokenForm((p) => ({ ...p, name: e.target.value }))}
				/>
			</div>
			<div className='col-md-6'>
				<label className='form-label'>Email</label>
				<input
					className='form-control'
					type='email'
					value={tokenForm.email ?? ''}
					onChange={(e) => setTokenForm((p) => ({ ...p, email: e.target.value }))}
				/>
			</div>
			<div className='col-md-6'>
				<label className='form-label'>Phone</label>
				<input
					className='form-control'
					value={tokenForm.phone ?? ''}
					onChange={(e) => setTokenForm((p) => ({ ...p, phone: e.target.value }))}
				/>
			</div>
			<div className='col-md-6'>
				<label className='form-label'>Age</label>
				<input
					className='form-control'
					type='number'
					min='0'
					value={tokenForm.age ?? ''}
					onChange={(e) =>
						setTokenForm((p) => ({
							...p,
							age: e.target.value === '' ? undefined : Number(e.target.value),
						}))
					}
				/>
			</div>
			<div className='col-md-6'>
				<label className='form-label'>Place</label>
				<input
					className='form-control'
					value={tokenForm.place ?? ''}
					onChange={(e) => setTokenForm((p) => ({ ...p, place: e.target.value }))}
				/>
			</div>
			<div className='col-12'>
				<label className='form-label'>Remarks</label>
				<textarea
					className='form-control'
					rows={2}
					value={tokenForm.remarks ?? ''}
					onChange={(e) => setTokenForm((p) => ({ ...p, remarks: e.target.value }))}
				/>
			</div>
			{showServingPoints && servingPoints && servingPoints.length > 0 && (
				<div className='col-12'>
					<label className='form-label text-muted small'>Serving points on this queue</label>
					<ul className='list-group list-group-flush border rounded small mb-0'>
						{servingPoints.map((sp) => (
							<li key={sp.id} className='list-group-item d-flex justify-content-between align-items-center py-2'>
								<span>{sp.name}</span>
								<span className='text-muted'>
									{sp.is_available === false ? 'Busy' : 'Available'}
								</span>
							</li>
						))}
					</ul>
					<div className='form-text'>
						Manage serving points from the Serving Points page or queue detail.
					</div>
				</div>
			)}
			<div className='col-12 d-flex justify-content-end align-items-center gap-2'>
				{onCancel && (
					<Button color='light' isLight type='button' onClick={onCancel}>
						Cancel
					</Button>
				)}
				<Button color='primary' type='submit' isDisable={isSubmitting}>
					{submitLabel}
				</Button>
			</div>
		</form>
	);
};

export default TokenCreateForm;
