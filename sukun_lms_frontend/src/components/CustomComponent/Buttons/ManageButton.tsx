import React from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import Button from '../../bootstrap/Button'; // Adjust the import according to your setup

interface ManageButtonProps {
  basePath: string;
}

const ManageButton: React.FC<ManageButtonProps> = ({  basePath }) => {
  const navigate = useNavigate();
  const handleClick = (e:any) => {
    e.stopPropagation();
    navigate(`${basePath}`);
  };

  return (
    <Button
      isOutline={false}
      color='dark'
      isLight
      size='sm'
      className={classNames('text-nowrap', {
        'border-light': false,
      })}
      icon='Edit'
      onClick={handleClick}>
      Manage
    </Button>
  );
};

export default ManageButton;
