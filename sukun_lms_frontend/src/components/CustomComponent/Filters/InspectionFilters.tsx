import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import Dropdown, { DropdownMenu, DropdownToggle } from '../../../components/bootstrap/Dropdown';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Label from '../../../components/bootstrap/forms/Label';
import Checks, { ChecksGroup } from '../../../components/bootstrap/forms/Checks';
import Button from '../../bootstrap/Button';

const statusChoices = ["Active", "Inactive", "Deleted"]
const FilterChoices=[{ label: "Created Date", value: "created_date__date" },{ label: "Last Modified Date", value: "gtcc_details_last_modified_date__date" }]


const InspectionFilter = ({onFilterHandler}) => {

    const [selectedStatusList, setSelectedStatusList] = useState<string[]>(['Active']);
    const [selectedFilterList, setSelectedFilterList] = useState<object>({ label: "Created Date", value: "created_date__date" });

    const [filterMenu, setFilterMenu] = useState(false);

   
  const handleStatus = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value // convert string to number
    const isChecked = e.target.checked;

    setSelectedStatusList(prev => {
        if (isChecked) {
            // Add the status if it's not already present
            return prev.includes(value) ? prev : [...prev, value];
        } else {
            // Remove the status if it's unchecked
            return prev.filter(item => item !== value);
        }
    });

    // setFilterList(prev => {
    //     if (isChecked) {
    //         // Add the ID if it's not already present
    //         return prev.includes(value) ? prev : [...prev, value];
    //     } else {
    //         // Remove the ID if it's unchecked
    //         return prev.filter(item => item !== value);
    //     }
    // });
    };

    const handleFilterTypeChange = (selectedFilterType) => {
        setSelectedFilterList(selectedFilterType);
    }

    // const handleReset = () => {
    //     setFilterList([]);
        
    //     // You might also want to reset the form inputs here
    // };
const fetchFilteredData = () => {
      onFilterHandler();
      setFilterMenu(false)
    };

    
    return (
        <Dropdown isOpen={filterMenu} setIsOpen={setFilterMenu}>
            <DropdownToggle hasIcon={false}>
                <Button icon='FilterAlt' color='primary' isLight aria-label='Filter' />
            </DropdownToggle>
            <DropdownMenu isAlignmentEnd size='lg' isCloseAfterLeave={false}>
                <div className='container py-2'>
                    <form className='row g-3'>
                        <div className='col-12'>
                            <FormGroup>
                                <Label>Status</Label>
                                <ChecksGroup>
                                    {statusChoices.map((mappedData) => (
                                        <Checks
                                            key={mappedData}
                                            id={mappedData}
                                            label={mappedData}
                                            
                                            name='Status'
                                            value={mappedData}
                                            onChange={handleStatus}
                                            checked={selectedStatusList.includes(mappedData)}
                                        />
                                    ))}
                                </ChecksGroup>
                            </FormGroup>
                        </div>
                         <div className='col-12'>
                            <FormGroup>
                                <Label>Filter / Sort By</Label>
                                <ChecksGroup>
                                    {FilterChoices.map((mappedData) => (
                                        <Checks
                                            key={mappedData.value}
                                            type='radio'
                                            // style={}
                                            id={mappedData.value}
                                            label={mappedData.label}
                                            name='Filter Keys'
                                            value={mappedData.value}
                                            onChange={() => handleFilterTypeChange(mappedData)}
                                            // @ts-ignore
                                            checked={selectedFilterList.value}
                                        />
                                    ))}
                                </ChecksGroup>
                            </FormGroup>
                        </div>
                        <div className='col-6'>
                            {/* <Button
                                color='secondary'
                                isOutline
                                className='w-100'
                                onClick={handleReset}
                                type="button"
                            >
                                Reset
                            </Button> */}
                        </div>
                        <div className='col-6'>
                            <Button color='secondary' className='w-100' onClick={()=>fetchFilteredData()} type="button">
                                Filter
                            </Button>
                        </div>
                    </form>
                </div>
            </DropdownMenu>
        </Dropdown>
    );
}

export default InspectionFilter;