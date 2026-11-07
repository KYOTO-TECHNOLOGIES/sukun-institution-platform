import React, { useContext } from 'react'
import dayjs from 'dayjs';
import { DateRangePicker } from 'react-date-range';
import Popovers from '../bootstrap/customPopoverForDateRange'
import Button from '../bootstrap/Button';
import ThemeContext from '../../contexts/themeContext';

const DateRangePickerComponent = ({popoverOpen,setPopoverOpen,setDate,date,dataFetcher}:any) => {
    const { mobileDesign } = useContext(ThemeContext);

    const datePicker = (
        <div className='d-flex flex-column'>
        <DateRangePicker
          onChange={(item: any) => {
                const startDate = item?.selection?.startDate || dayjs().toDate();
                const maxDate = dayjs(startDate).add(3, 'month').toDate();
                const endDate = item?.selection?.endDate && item.selection.endDate <= maxDate
                  ? item.selection.endDate
                  : startDate;
              setDate({
                selection: {
                  startDate ,
                  endDate,
                  key: 'selection',
                },
              });
            }}
            moveRangeOnFirstSelection={false}
            months={2}
            ranges={[date?.selection || { startDate: dayjs().toDate(), endDate: dayjs().toDate() }]}
            maxDate={dayjs().add(3, 'month').toDate()}
            direction={mobileDesign ? 'vertical' : 'horizontal'}
            rangeColors={[String(import.meta.env.VITE_PRIMARY_COLOR)]}
            inputRanges={[]}
          />
          <div className='d-flex justify-content-end gap-2' style={{ marginBottom: '5px', marginRight: '8px', marginTop: '-10px' }}>
            <Button
              size='sm'
              color='danger'
              onClick={() => {
                setPopoverOpen(false);
                      setDate(null)
                dataFetcher();
              }}
              isDisable={date===null}
            >
              Clear
            </Button>
              <Button
              size='sm'
              color='info'
              isDisable={date===null}
              onClick={() => {
                setPopoverOpen(false);
                dataFetcher();
              }}
            >
              Filter
            </Button>
          </div>
        </div>
      );
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
      {date
        ? `${dayjs(date.selection.startDate).format('DD/MM/YYYY')} - ${dayjs(date.selection.endDate).format('DD/MM/YYYY')}`
        : 'Date filter'}
    </Button>
  </Popovers>
  )
}

export default DateRangePickerComponent
