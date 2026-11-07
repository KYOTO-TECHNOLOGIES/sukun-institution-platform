import React from 'react'
import useDarkMode from '../../../hooks/useDarkMode';

type Status = {
  label: string;
  value: string;
};

type StatusFiltersProps = {
  statuses: Status[];
  selectedStatuses: string[];
  onChange: (values: string[]) => void;
};

const getStatusColors = (status: string, isDarkMode: boolean) => {
  const baseColors = {
    active: { bg: '#E6F4EA', tick: '#34A853' },
    disabled: { bg: '#FFF3E0', tick: '#FF9800' },
    deleted: { bg: '#FFEBEE', tick: '#F44336' },
    invited: { bg: '#E3F2FD', tick: '#2196F3' },
    default: { bg: '#F5F5F5', tick: '#757575' }
  };

  const darkModeColors = {
    active: { bg: '#1B3B1F', tick: '#34A853' },
    disabled: { bg: '#3D2C1F', tick: '#FF9800' },
    deleted: { bg: '#3D1F1F', tick: '#F44336' },
    invited: { bg: '#1F2B3D', tick: '#2196F3' },
    default: { bg: '#2D2D2D', tick: '#757575' }
  };

  const colors = isDarkMode ? darkModeColors : baseColors;
  
  switch (status.toLowerCase()) {
    case 'active':
      return colors.active;
    case 'disabled':
      return colors.disabled;
    case 'deleted':
      return colors.deleted;
    case 'invited':
      return colors.invited;
    default:
      return colors.default;
  }
};

const StatusFilters: React.FC<StatusFiltersProps> = ({ statuses, selectedStatuses, onChange }) => {
  const { darkModeStatus } = useDarkMode();
  
  const handleToggle = (value: string) => {
    if (selectedStatuses.includes(value)) {
      onChange(selectedStatuses.filter((v) => v !== value));
    } else {
      onChange([...selectedStatuses, value]);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {statuses.map((status) => {
        const isActive = selectedStatuses.includes(status.value);
        const colors = getStatusColors(status.value, darkModeStatus);
        
        return (
          <button
            key={status.value}
            onClick={() => handleToggle(status.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px',
              border: 'none',
              background: colors.bg,
              color: darkModeStatus ? '#fff' : '#222',
              padding: '6px 14px',
              fontWeight: 500,
              fontSize: '0.875rem',
              position: 'relative',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.2s',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                width: 16,
                height: 16,
                borderRadius: '2px',
                background: isActive ? colors.tick : 'transparent',
                border: `1px solid ${colors.tick}`,
                marginRight: 6,
                marginTop: "-2px",
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isActive ? (
                <svg width="12" height="12" fill="#fff" viewBox="0 0 16 16">
                  <path d="M6.173 13.727a.75.75 0 0 1-1.06 0l-3.84-3.84a.75.75 0 1 1 1.06-1.06l3.31 3.31 7.31-7.31a.75.75 0 0 1 1.06 1.06l-7.84 7.84z"/>
                </svg>
              ) : null}
            </span>
            {status.label}
          </button>
        );
      })}
    </div>
  )
}

export default StatusFilters