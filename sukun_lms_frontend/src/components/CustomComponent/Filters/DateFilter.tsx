import React, { useState } from 'react';
import { Calendar } from 'react-date-range';
import dayjs from 'dayjs';
import Button from '../../bootstrap/Button';
import Popovers from '../../bootstrap/customPopoverForDateRange';

type Direction =
	| 'auto'
	| 'auto-start'
	| 'auto-end'
	| 'top'
	| 'top-start'
	| 'top-end'
	| 'bottom'
	| 'bottom-start'
	| 'bottom-end'
	| 'right'
	| 'right-start'
	| 'right-end'
	| 'left'
	| 'left-start'
	| 'left-end';

export type DateFilterValue = {
	date: Date;
	/** Local calendar day `YYYY-MM-DD` for API query params. */
	dateFilter: string;
};

interface DateFilterProps {
	onFilter: (value: DateFilterValue | null) => void;
	selectedDate?: DateFilterValue | null;
	placement?: Direction;
	/** Button label when no date is selected yet. */
	placeholder?: string;
}

const DateFilter: React.FC<DateFilterProps> = ({
	onFilter,
	selectedDate,
	placement = 'bottom-end',
	placeholder = 'Date Filter',
}) => {
	const [pendingDate, setPendingDate] = useState<Date | null>(null);
	const [popoverOpen, setPopoverOpen] = useState(false);

	const activeDate = selectedDate?.date ?? dayjs().toDate();
	const pickerDate = pendingDate ?? activeDate;

	const handleFilter = () => {
		if (!pendingDate) return;
		onFilter({
			date: pendingDate,
			dateFilter: dayjs(pendingDate).format('YYYY-MM-DD'),
		});
		setPendingDate(null);
		setPopoverOpen(false);
	};

	const handleClear = () => {
		const today = dayjs().toDate();
		onFilter({
			date: today,
			dateFilter: dayjs().format('YYYY-MM-DD'),
		});
		setPendingDate(null);
		setPopoverOpen(false);
	};

	const datePicker = (
		<div className='d-flex flex-column'>
			<Calendar
				onChange={(date: Date) => setPendingDate(date)}
				date={pickerDate}
				maxDate={new Date()}
				color={String(import.meta.env.VITE_PRIMARY_COLOR)}
			/>
			<div
				className='d-flex justify-content-end gap-2'
				style={{
					marginBottom: '5px',
					marginRight: '8px',
					marginTop: '-10px',
				}}>
				<Button
					size='sm'
					color='danger'
					onClick={handleClear}
					isDisable={!pendingDate && !selectedDate}>
					Clear
				</Button>
				<Button size='sm' color='primary' onClick={handleFilter} isDisable={!pendingDate}>
					Filter
				</Button>
			</div>
		</div>
	);

	return (
		<Popovers
			placement={placement}
			popoverOpen={popoverOpen}
			setPopoverOpen={setPopoverOpen}
			className='mw-100 overflow-hidden'
			data-tour='date-filter-menu'
			bodyClassName='p-0'
			trigger='click'
			desc={datePicker}>
			<Button color='primary' isLight icon='DateRange' className='date-range-trigger'>
				{selectedDate
					? dayjs(selectedDate.date).format('DD-MM-YYYY')
					: placeholder}
			</Button>
		</Popovers>
	);
};

export default DateFilter;
