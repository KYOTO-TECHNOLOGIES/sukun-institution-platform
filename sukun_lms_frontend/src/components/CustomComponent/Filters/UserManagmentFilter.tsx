import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import Dropdown, { DropdownMenu, DropdownToggle } from '../../../components/bootstrap/Dropdown';
import FormGroup from '../../../components/bootstrap/forms/FormGroup';
import Label from '../../../components/bootstrap/forms/Label';
import Checks, { ChecksGroup } from '../../../components/bootstrap/forms/Checks';
import Button from '../../bootstrap/Button';

const statusChoices = ["Active", "Disabled",'Pending']
const partyTypeChoices = ["GTCC", "Establishment","Authority","Region"]


const UserManagmentFilter = ({onFilterHandler}: {onFilterHandler: (values: any) => void}) => {

    const [selectedStatusList, setSelectedStatusList] = useState<string[]>(['Active']);
    const [selectedPartyTypeList, setSelectedPartyTypeList] = useState<string[]>(['GTCC','Establishment','Authority','Region']);

    const [filterMenu, setFilterMenu] = useState(false);

   
  const handlePartyType = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const isChecked = e.target.checked;

    setSelectedPartyTypeList(prev => {
        if (isChecked) {
            return prev.includes(value) ? prev : [...prev, value];
        } else {
            return prev.filter(item => item !== value);
        }
    });
  };

  const handleStatus = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const isChecked = e.target.checked;

    setSelectedStatusList(prev => {
        if (isChecked) {
            return prev.includes(value) ? prev : [...prev, value];
        } else {
            return prev.filter(item => item !== value);
        }
    });
  };

  const fetchFilteredData = () => {
      // Build query parameters object
      let queryParams = '';
      
      if (selectedPartyTypeList.length > 0) {
          queryParams+= `&party_type=${selectedPartyTypeList.join('&party_type=')}`;
      }
      
      if (selectedStatusList.length > 0) {
          queryParams+= `&status=${selectedStatusList.join('&status=')}`;
      }
      
      onFilterHandler(queryParams);
      setFilterMenu(false);
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
                                <Label>Party Type</Label>
                                <ChecksGroup>
                                    {partyTypeChoices.map((mappedData) => (
                                        <Checks
                                            key={mappedData}
                                            id={mappedData}
                                            label={mappedData}
                                            
                                            name='Party Type'
                                            value={mappedData}
                                            onChange={handlePartyType}
                                            checked={selectedPartyTypeList.includes(mappedData)}
                                        />
                                    ))}
                                </ChecksGroup>
                            </FormGroup>
                        </div>

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
                        <div className='col-6'>
                            {/* <Button
                                color='primary'
                                isOutline
                                className='w-100'
                                onClick={handleReset}
                                type="button"
                            >
                                Reset
                            </Button> */}
                        </div>
                        <div className='col-6'>
                            <Button color='primary' className='w-100' onClick={()=>fetchFilteredData()} type="button">
                                Filter
                            </Button>
                        </div>
                    </form>
                </div>
            </DropdownMenu>
        </Dropdown>
    );
}

export default UserManagmentFilter;