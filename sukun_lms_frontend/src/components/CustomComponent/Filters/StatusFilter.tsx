import React, { useState } from 'react'
import Dropdown, { DropdownMenu, DropdownToggle } from '../../bootstrap/Dropdown'
import { ChecksGroup } from '../../bootstrap/forms/Checks';
import Button from '../../bootstrap/Button';
import FormGroup from '../../bootstrap/forms/FormGroup';
import Label from '../../bootstrap/forms/Label';
import Checks from '../../bootstrap/forms/Checks';

const statusChoices = ['Active','Disabled']
function StatusFilter({onFilterHandler,filterList}) {
    const [filterMenu, setFilterMenu] = useState(false);
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
                                            onChange={(e:any) => onFilterHandler(e)}
                                            checked={filterList.includes(mappedData)}
                                        />
                                    ))}
                                </ChecksGroup>
                            </FormGroup>
                        </div>
                    </form>
                    </div>
                </DropdownMenu>
            </Dropdown>
  )
}

export default StatusFilter