
import React, { useContext, useState } from 'react';
import { DateRangePicker } from 'react-date-range';
import dayjs from 'dayjs';
import Button from '../../bootstrap/Button';
import ThemeContext from '../../../contexts/themeContext';
import Popovers from '../../bootstrap/customPopoverForDateRange';
// import Popovers from '../../bootstrap/customPopoverForDateRange';

interface DateRangeFilterProps {
  onFilter: (date: { selection: { startDate: Date; endDate: Date; key: string,endDateFilter:string,startDateFilter:string } } | null) => void;
  selectedDate:{ selection: { startDate: Date; endDate: Date; key: string ,endDateFilter:string,startDateFilter:string,} }

}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ onFilter ,selectedDate}) => {
  const [date, setDate] = useState<{ selection: { startDate: Date; endDate: Date; key: string ,endDateFilter:string,startDateFilter:string} } | null>(null);
  const { mobileDesign } = useContext(ThemeContext);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleFilter = () => {
    onFilter(date);
    setPopoverOpen(false);

  };

  const handleClear = () => {
    if(selectedDate){
      onFilter(null);
    }
    setDate(null);
    setPopoverOpen(false);

  };

  const maxDate = date?.selection?.startDate
    ? dayjs(date.selection.startDate).add(3, 'month').toDate()
    : dayjs().add(3, 'month').toDate();


    const datePicker=(
      <div className="d-flex flex-column">
      <DateRangePicker
        onChange={(item: any) => {
          const startDate = item?.selection?.startDate || dayjs().toDate();
          const endDate =
            item?.selection?.endDate && item.selection.endDate <= maxDate
              ? item.selection.endDate
              : startDate;
          setDate({
            selection: {
              startDate,
              endDate,
              key: 'selection',
              startDateFilter:dayjs(startDate).format('YYYY-MM-DD'),
              endDateFilter:dayjs(endDate).format('YYYY-MM-DD'),

            },
          });
          
        }}
        moveRangeOnFirstSelection={false}
        months={2}
        ranges={[
          date?.selection || {
            startDate: dayjs().toDate(),
            endDate: dayjs().toDate(),
            key: 'selection',
          },
        ]}
        maxDate={maxDate}
        direction={mobileDesign ? 'vertical' : 'horizontal'}
        rangeColors={[String(import.meta.env.VITE_PRIMARY_COLOR)]}
        inputRanges={[]}
      />
      <div
        className="d-flex justify-content-end gap-2"
        style={{
          marginBottom: '5px',
          marginRight: '8px',
          marginTop: '-10px',
        }}
      >
        <Button size="sm" color="danger" onClick={handleClear} isDisable={!date}>
          Clear
        </Button>
        <Button size="sm" color="primary" onClick={handleFilter} isDisable={!date}>
          Filter
        </Button>
      </div>
    </div>
    )

  return (
        <Popovers
          placement='right-start'
          popoverOpen={popoverOpen}
          setPopoverOpen={setPopoverOpen}
          className='mw-100 overflow-hidden'
          data-tour='date-range-menu'
          bodyClassName='p-0'
          trigger='click'
          desc={datePicker}
        >
          <Button color='primary' isLight  icon='DateRange'>
            {selectedDate
              ? `${dayjs(selectedDate.selection.startDate).format('YYYY/MM/DD')} - ${dayjs(selectedDate.selection.endDate).format('YYYY/MM/DD')}`
              : 'Date Filter'}
          </Button>
        </Popovers>
  );
};

export default DateRangeFilter;