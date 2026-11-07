import React, { useContext, useEffect, useState } from 'react';
import { DateRangePicker } from 'react-date-range';
import dayjs from 'dayjs';
import Button from '../../bootstrap/Button';
import ThemeContext from '../../../contexts/themeContext';
import Popovers from '../../bootstrap/customPopoverForDateRange';
import Label from '../../bootstrap/forms/Label';
import formatTime from '../../../helpers/formatTime';

interface DateRangeAndTimeFilterProps {
  onFilter: (date: { selection: { startDate: Date; endDate: Date; key: string,startTime:string,endTime:string,startDateAndTime:string,endDateAndTime:string, } } | null) => void;
  selectedDate:{ selection: { startDate: Date; endDate: Date; key: string ,startTime:string,endTime:string,startDateAndTime:string,endDateAndTime:string,} }
}

const DateRangeAndTimeFilter: React.FC<DateRangeAndTimeFilterProps> = ({ onFilter ,selectedDate}) => {
  const [date, setDate] = useState<{ selection: { startDate: Date; endDate: Date; key: string ,startTime:string,endTime:string,startDateAndTime:string,endDateAndTime:string,} } | null>(null);
  const { mobileDesign } = useContext(ThemeContext);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleFilter = () => {
    onFilter(date);
    setPopoverOpen(false);

  };

  const handleClear = () => {
    setDate(null);
    setPopoverOpen(false);
    if(selectedDate){
      onFilter(null);
    }
   
  };

  const handleTimeChange = (type: 'startTime' | 'endTime', value: string) => {
    if (date) {
      const isStartTime = type === "startTime";
      const dateKey = isStartTime ? "startDate" : "endDate";
      const timeKey = isStartTime ? "startDateAndTime" : "endDateAndTime";
  
      setDate({
        selection: {
          ...date.selection,
          [type]: value,
          [timeKey]: `${dayjs(date.selection[dateKey]).format('YYYY-MM-DD')} ${value || (isStartTime ? '00:00' : '23:59')}`,
        },
      });
    }
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
              startTime:date?.selection?.startTime||'00:00',
              endTime:date?.selection?.endTime|| '23:59',
              startDateAndTime:`${dayjs(startDate).format('YYYY-MM-DD')} ${date?.selection?.startTime||'00:00'}`,
              endDateAndTime:`${dayjs(endDate).format('YYYY-MM-DD')} ${date?.selection?.endTime|| '23:59'}`,
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
        rangeColors={[String(import.meta.env.VITE_SECONDARY_COLOR)]}
        inputRanges={[]}
      />

<div  style={{width:"200px",position:"absolute",bottom:"50px"}}>
        <div className="d-flex  align-items-center p-2">
       <Label htmlFor="start-time"  style={{width:"120px"}}>Start Time : </Label>
        <input
            type="time"
            id="start-time"
            className='form-control'
            value={date?.selection?.startTime}
            onChange={(e) => handleTimeChange('startTime', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace') {
                e.preventDefault(); // Prevent backspace action
              }
            }}

          />
         
        </div>
        <div className="d-flex justify-content-between align-items-center p-2">
        <Label  htmlFor="end-time" style={{width:"120px"}}>End Time : </Label>
        <input
            type="time"
            id="end-time"
            className='form-control'
            onChange={(e) => handleTimeChange('endTime', e.target.value)}
            value={date?.selection?.endTime}
            min={date?.selection?.startTime || undefined}
            onKeyDown={(e) => {
              if (e.key === 'Backspace') {
                e.preventDefault(); // Prevent backspace action
              }
            }}
          />
         
        </div>
      </div>
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
          <Button color='dark' isLight  icon='DateRange'>
            {selectedDate
              ? `${dayjs(selectedDate.selection.startDate).format('YYYY/MM/DD')} : ${formatTime(selectedDate.selection.startTime)} - ${dayjs(selectedDate.selection.endDate).format('YYYY/MM/DD')} : ${formatTime(selectedDate.selection.endTime)}`
              : 'Date Time Filter'}
          </Button>
        </Popovers>
  );
};

export default DateRangeAndTimeFilter;










