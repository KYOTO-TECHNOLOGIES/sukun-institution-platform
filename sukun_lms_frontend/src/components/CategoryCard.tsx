import React, { useState } from 'react';
import Button from './bootstrap/Button';
import InlineEditableField from './CustomComponent/Fields/InlineEditableFiled';
// import { Button } from '../components/Button';

interface CategoryCardProps {
    category: string;
    onEdit: (newValue: string) => void;
    onDelete: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onEdit, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedValue, setEditedValue] = useState(category);
    const [isHovered, setIsHovered] = useState(false);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = () => {
        onEdit(editedValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedValue(category);
        setIsEditing(false);
    };

    return (
        <div 
            className="category-card p-3 border rounded shadow-sm position-relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
                <div className="d-flex justify-content-between align-items-center">
                    <InlineEditableField
                        initialValue={category}
                        patchUrl={`/api/category/`}
                        fieldKey="name"
                        id='category'
                        type="text"
                        styles={{fontSize:'1.1rem',fontWeight:'bold',marginTop:'-8px'}}
                    />
                    {/* <div 
                        className="category-name flex-grow-1"
                        onClick={handleEdit}
                        style={{ cursor: 'pointer' }}
                    >
                        {category}
                    </div> */}
                    <div 
                        className="action-buttons d-flex gap-2"
                        style={{
                            opacity: isHovered ? 1 : 0,
                            transform: `translateX(${isHovered ? '0' : '10px'})`,
                            transition: 'all 0.2s ease-in-out',
                            pointerEvents: isHovered ? 'auto' : 'none'
                        }}
                    >
                        {/* <Button
                            icon="Edit"
                            color="secondary"
                            isOutline
                            isLight
                            onClick={handleEdit}
                        /> */}
                        <Button
                            icon="Delete"
                            color="danger"
                            isOutline
                            isLight
                            onClick={onDelete}
                        />
                    </div>
                </div>
            {/* )} */}
        </div>
    );
};

export default CategoryCard; 