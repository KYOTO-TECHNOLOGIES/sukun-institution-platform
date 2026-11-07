import React, { useContext } from 'react'
import classNames from 'classnames';
import Card, { CardBody } from '../../../bootstrap/Card';
import AuthContext from '../../../../contexts/authContext';
import Dropdown, { DropdownMenu, DropdownToggle,DropdownItem } from '../../../bootstrap/Dropdown';
import Badge from '../../../bootstrap/Badge';
import Icon from '../../../icon/Icon';
import Button from '../../../bootstrap/Button';
import useDarkMode from '../../../../hooks/useDarkMode';
import { getFirstLetters } from '../../../../helpers/helpers';
import { badgeColorOptions } from '../../../../helpers/constants';

function DocumentCard({ document_data, handleEdit, fetchData, handleDelete, handleStatusUpdate }: { document_data: any, handleEdit: (item: any) => void, fetchData: () => void, handleDelete: (id: number) => void, handleStatusUpdate: (id: number, status: string, message: string) => void }) {
    const { userData } = useContext(AuthContext);
    const { darkModeStatus } = useDarkMode();
  return (
    <div className='col d-flex justify-content-center'>
    <Card
    borderSize={0}
    shadow='sm'
    style={{
      width: 240,
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    }}
    className='hover-shadow-lg'
  >
    <CardBody className='p-4'>
      <div className='d-flex flex-column align-items-center position-relative'>
        {/* Dropdown at top right */}
        {userData.user_type !== 'User' && (
          <div
            className='position-absolute top-0 end-0'
            >
            <Dropdown>
              <DropdownToggle hasIcon={false}>
                <Icon icon='MoreHoriz' size='md' />
              </DropdownToggle>
              <DropdownMenu isAlignmentEnd>
                {document_data.status !== 'Deleted' && (
                  <>
                    <DropdownItem>
                      <Button
                        icon='Edit'
                        onClick={() => handleEdit(document_data)}
                      >
                        Edit
                      </Button>
                    </DropdownItem>
                    <DropdownItem isDivider />
                  </>
                )}

                {document_data.status !== 'Deleted' && (
                  <DropdownItem>
                    <Button
                      icon='Delete'
                      onClick={() => handleDelete(document_data.id)}
                    >
                      Delete
                    </Button>
                  </DropdownItem>
                )}

                {!['Active', 'Deleted'].includes(document_data.status) && (
                  <DropdownItem>
                    <Button
                      icon='LockOpen'
                      onClick={() => handleStatusUpdate(document_data.id, 'Active', 'Document Type will be enabled')}
                    >
                      Activate
                    </Button>
                  </DropdownItem>
                )}

                {!['Disabled', 'Deleted'].includes(document_data.status) && (
                  <DropdownItem>
                    <Button
                      icon='Lock'
                      onClick={() => handleStatusUpdate(document_data.id, 'Disabled', 'Document Type will be disabled')}
                    >
                      Disable
                    </Button>
                  </DropdownItem>
                )}

                {document_data.status === 'Deleted' && (
                  <DropdownItem>
                    <Button
                      icon='Undo'
                      onClick={() => handleStatusUpdate(document_data.id, 'Active', 'Document Type will be recovered')}
                    >
                      Recover
                    </Button>
                  </DropdownItem>
                )}
              </DropdownMenu>
            </Dropdown>
          </div>
        )}

        {/* Avatar - Circular and larger */}
        <div
          className='ratio ratio-1x1 mb-4'
          style={{
            width: 100,
            transition: 'transform 0.3s ease'
          }}
        >
          <div
            className={classNames(
              'rounded-circle',
              'd-flex align-items-center justify-content-center',
              {
                'bg-l10-dark': !darkModeStatus,
                'bg-l90-dark': darkModeStatus,
              },
            )}
            style={{
              boxShadow: darkModeStatus
                ? '0 4px 12px rgba(255, 255, 255, 0.1)'
                : '0 4px 12px rgba(0, 0, 0, 0.08)',
            }}
          >
            <span
              className='fw-bold'
              style={{
                fontSize: '32px',
                letterSpacing: '1px'
              }}
            >
              {document_data?.name && getFirstLetters(document_data?.name)}
            </span>
          </div>
        </div>

        {/* Designation Name - Better typography */}
        <div
          className='fw-bold text-center mb-3'
        //   title={item.short_description}
          style={{
            fontSize: '18px',
            lineHeight: '1.4',
            letterSpacing: '0.2px',
            cursor: 'help'
          }}
          title={document_data.short_description}

        >
          {document_data?.name}
        </div>

        {/* Status */}
        <small className={`border border-${badgeColorOptions[document_data?.status]} border-2 text-${badgeColorOptions[document_data?.status]} fw-bold px-2 py-1 rounded-1 mb-2`}>
          {document_data?.status}
        </small>

        {/* File Details Section */}
        {(document_data.max_size_mb || document_data.allowed_extensions) && (
          <div className='mt-1 w-100 d-flex flex-column gap-2' style={{ 
            // paddingTop: '12px'
          }}>
            {/* Max Size */}
            {document_data.max_size_mb && (
              <div 
                className='d-flex align-items-center justify-content-center px-3 py-2'
                style={{ 
                //   background: darkModeStatus 
                //     ? 'linear-gradient(135deg, rgba(255,193,7,0.1) 0%, rgba(255,152,0,0.05) 100%)'
                //     : 'linear-gradient(135deg, rgba(255,193,7,0.08) 0%, rgba(255,152,0,0.04) 100%)',
                  borderRadius: '8px',
                  border: darkModeStatus 
                    ? '1px solid rgba(255,193,7,0.15)' 
                    : '1px solid rgba(255,193,7,0.1)'
                }}
              >
                <Icon
                  icon='CloudUpload'
                  className='me-2'
                  style={{ fontSize: '16px', color: '#ff9800' }}
                />
                <span style={{ 
                  fontSize: '11px', 
                  color: darkModeStatus ? 'rgba(255,193,7,0.9)' : '#f57c00',
                  fontWeight: 600,
                  letterSpacing: '0.3px'
                }}>
                  Max Size: {document_data.max_size_mb} MB
                </span>
              </div>
            )}

            {/* Allowed Extensions */}
            {document_data.allowed_extensions && (
              <div 
                className='px-3 py-2'
                style={{ 
                //   background: darkModeStatus 
                //     ? 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(56,142,60,0.05) 100%)'
                //     : 'linear-gradient(135deg, rgba(76,175,80,0.08) 0%, rgba(56,142,60,0.04) 100%)',
                  borderRadius: '8px',
                  border: darkModeStatus 
                    ? '1px solid rgba(76,175,80,0.15)' 
                    : '1px solid rgba(76,175,80,0.1)'
                }}
              >
                <div className='d-flex align-items-center justify-content-center mb-1'>
                  <Icon
                    icon='InsertDriveFile'
                    className='me-1'
                    style={{ fontSize: '14px', color: '#4caf50' }}
                  />
                  <span style={{ 
                    fontSize: '9px', 
                    // color: darkModeStatus ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Allowed Types
                  </span>
                </div>
                <div className='d-flex flex-wrap justify-content-center gap-1'>
                  {document_data.allowed_extensions.split(',').map((ext: string, index: number) => (
                    <span
                      key={index}
                      style={{ 
                        fontSize: '10px', 
                        // color: darkModeStatus ? '#81c784' : '#388e3c',
                        fontWeight: 700,
                        background: darkModeStatus ? 'rgba(76,175,80,0.15)' : 'rgba(76,175,80,0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        letterSpacing: '0.3px'
                      }}
                    >
                      .{ext.trim().toLowerCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </CardBody>
  </Card>
  </div>
  )
}

export default DocumentCard