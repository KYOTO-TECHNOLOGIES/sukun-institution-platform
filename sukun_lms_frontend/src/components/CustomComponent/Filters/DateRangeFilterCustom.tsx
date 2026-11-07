import React, { useContext, useMemo, useState } from 'react';
import { DateRangePicker, defaultStaticRanges } from 'react-date-range';
import dayjs from 'dayjs';
import Button from '../../bootstrap/Button';
import ThemeContext from '../../../contexts/themeContext';
import Popovers from '../../bootstrap/customPopoverForDateRange';
import { useTranslation } from 'react-i18next';
// import Popovers from '../../bootstrap/customPopoverForDateRange';
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

interface DateRangeFilterProps {
	onFilter: (
		date: {
			selection: {
				startDate: Date;
				endDate: Date;
				key: string;
				endDateFilter: string;
				startDateFilter: string;
			};
		} | null,
	) => void;
	selectedDate?: {
		selection: {
			startDate: Date;
			endDate: Date;
			key: string;
			endDateFilter: string;
			startDateFilter: string;
		};
	} | null;
	placement?: Direction;
	maxDays?: number;
	minDays?: number;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
	onFilter,
	selectedDate,
	placement = 'left-start',
	maxDays,
	minDays,
}) => {
	const [date, setDate] = useState<{
		selection: {
			startDate: Date;
			endDate: Date;
			key: string;
			endDateFilter: string;
			startDateFilter: string;
		};
	} | null>(null);
	const { mobileDesign } = useContext(ThemeContext);
	const [popoverOpen, setPopoverOpen] = useState(false);
	const { t } = useTranslation();
	const filteredStaticRanges = useMemo(() => {
		return defaultStaticRanges.filter((range) => {
			const label = range.label?.toLowerCase() || '';
			return label === 'this week' || label === 'last week';
		});
	}, []);

	const handleFilter = () => {
		onFilter(date);
		setPopoverOpen(false);
	};

	const handleClear = () => {
		if (selectedDate) {
			onFilter(null);
		}
		setDate(null);
		// setPopoverOpen(false);
	};

	const maxDate =
		maxDays && date?.selection?.startDate
			? dayjs(date.selection.startDate)
				.add(maxDays - 1, 'day')
				.toDate()
			: date?.selection?.startDate
				? dayjs(date.selection.startDate).add(3, 'month').toDate()
				: dayjs().add(3, 'month').toDate();

	const datePicker = (
		<div className='d-flex flex-column'>
			<DateRangePicker
				onChange={(item: any) => {
					const startDate = item?.selection?.startDate || dayjs().toDate();
					let endDate =
						item?.selection?.endDate && item.selection.endDate <= maxDate
							? item.selection.endDate
							: startDate;

					// If maxDays is specified, restrict the end date to maxDays from start date
					if (maxDays && startDate) {
						const maxEndDate = dayjs(startDate)
							.add(maxDays - 1, 'day')
							.toDate(); // -1 because start date is day 1
						if (endDate > maxEndDate) {
							endDate = maxEndDate;
						}
					}

					// If minDays is specified, ensure the end date is at least minDays from start date
					if (minDays && startDate) {
						const minEndDate = dayjs(startDate)
							.add(minDays - 1, 'day')
							.toDate(); // -1 because start date is day 1
						if (endDate < minEndDate) {
							endDate = minEndDate;
						}
					}

					setDate({
						selection: {
							startDate,
							endDate,
							key: 'selection',
							startDateFilter: dayjs(startDate).format('YYYY-MM-DD'),
							endDateFilter: dayjs(endDate).format('YYYY-MM-DD'),
						},
					});
				}}
				moveRangeOnFirstSelection={false}
				months={2}
				ranges={[
					date?.selection ||
					selectedDate?.selection || {
						startDate: dayjs().toDate(),
						endDate: dayjs().toDate(),
						key: 'selection',
					},
				]}
				maxDate={maxDate}
				direction={mobileDesign ? 'vertical' : 'horizontal'}
				rangeColors={[String(import.meta.env.VITE_PRIMARY_COLOR)]}
				inputRanges={[]}
				staticRanges={filteredStaticRanges}
			/>
			<div
				className='d-flex justify-content-end gap-2'
				style={{
					marginBottom: '5px',
					marginRight: '8px',
					marginTop: '-10px',
				}}>
				<Button size='sm' color='danger' onClick={handleClear} isDisable={!date}>
					{t('Clear')}
				</Button>
				<Button
					size='sm'
					color='primary'
					onClick={handleFilter}
					isDisable={
						!date ||
						(minDays &&
							date.selection.startDate &&
							date.selection.endDate &&
							dayjs(date.selection.endDate).diff(
								dayjs(date.selection.startDate),
								'day',
							) <
							minDays - 1) ||
						(maxDays &&
							date.selection.startDate &&
							date.selection.endDate &&
							dayjs(date.selection.endDate).diff(
								dayjs(date.selection.startDate),
								'day',
							) >
							maxDays - 1)
					}>
					{t('Filter')}
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
			data-tour='date-range-menu'
			bodyClassName='p-0'
			trigger='click'
			desc={datePicker}>
			<Button color='primary' isLight icon='DateRange' className='date-range-trigger'>
				{selectedDate?.selection
					? `${dayjs(selectedDate.selection.startDate).format('DD-MM-YYYY')} to ${dayjs(selectedDate.selection.endDate).format('DD-MM-YYYY')}`
					: t('Date Filter')}
			</Button>
		</Popovers>
	);
};

export default DateRangeFilter;