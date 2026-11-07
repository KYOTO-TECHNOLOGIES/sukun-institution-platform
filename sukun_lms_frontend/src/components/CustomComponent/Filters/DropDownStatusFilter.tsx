import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import Dropdown, { DropdownMenu, DropdownToggle } from '../../../components/bootstrap/Dropdown';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Label from '../../../components/bootstrap/forms/Label';
import Checks, { ChecksGroup } from '../../../components/bootstrap/forms/Checks';
import Button from '../../bootstrap/Button';

const DropdownStatusFilter = ({setFilterList,filterList,fetchData,list}) => {
    const [filterMenu, setFilterMenu] = useState(false);

   
  const handleFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value // convert string to number
    const isChecked = e.target.checked;

    setFilterList(prev => {
        if (isChecked) {
            // Add the ID if it's not already present
            return prev.includes(value) ? prev : [...prev, value];
        } else {
            // Remove the ID if it's unchecked
            return prev.filter(item => item !== value);
        }
    });
};


    const handleReset = () => {
        setFilterList([]);
        // You might also want to reset the form inputs here
    };
const fetchFilteredData = () => {
      fetchData();
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
                        {/* <div className='col-12'>
                            <FormGroup>
                                <Label htmlFor='name'>Name</Label>
                                <Input
                                    id='searchInput2'
                                    name='searchInput'
                                    ariaLabel='name'
                                    placeholder='Employee Name'                                 
                                />
                            </FormGroup>
                        </div> */}
                        <div className='col-12'>
                            <FormGroup>
                                <Label>Roles</Label>
                                <ChecksGroup>
                                    {list.length!==0&&list.map((user) => (
                                        <Checks
                                            key={user.label}
                                            id={user.label}
                                            label={user.label}
                                            name='User'
                                            value={user.value}
                                            onChange={handleFilter}
                                            checked={filterList.includes(user.value)}
                                        />
                                    ))}
                                </ChecksGroup>
                            </FormGroup>
                        </div>
                        <div className='col-6'>
                            <Button
                                color='secondary'
                                isOutline
                                className='w-100'
                                onClick={handleReset}
                                type="button"
                            >
                                Reset
                            </Button>
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

export default DropdownStatusFilter;