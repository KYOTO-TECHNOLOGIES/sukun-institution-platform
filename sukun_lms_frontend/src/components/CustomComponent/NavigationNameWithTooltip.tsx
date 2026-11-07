import React, { FC } from 'react';
import { Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface NavigationNameWithTooltipProps {
  title: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  navigateTo: string;
  state?: any;
  content: string | JSX.Element;
  style?: React.CSSProperties;
}

const NavigationNameWithTooltip: FC<NavigationNameWithTooltipProps> = ({
  title,
  placement = 'right',
  navigateTo,
  state,
  content,
  style = { cursor: 'pointer', fontWeight: 490, width: '100px' },
}) => {
  const navigate = useNavigate();

  return (
    <Tooltip arrow title={title} placement={placement}>
      <div
        style={style}
        onClick={() => navigate(navigateTo, { state })}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') navigate(navigateTo, { state });
        }}
      >
        {content}
      </div>
    </Tooltip>
  );
};

export default NavigationNameWithTooltip;
