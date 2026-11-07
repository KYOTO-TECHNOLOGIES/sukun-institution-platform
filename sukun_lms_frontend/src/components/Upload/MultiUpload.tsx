import React, { useState, useEffect } from 'react';
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { Stack } from '@mui/material';

interface ExistingImage {
    id: number;
    created_at: string;
    updated_at: string;
    image: string;
    is_primary: boolean;
    violation: number;
}

interface ImageData {
    preview: string;
    isExisting: boolean;
    existingId?: number;
    file?: File;
}

interface ImageUploaderProps {
    setFileImages: (images: any) => void;
    fileImages: File[];
    isEdit?: boolean;
    existingImages?: ExistingImage[];
}

function ImageUploader({setFileImages, fileImages, isEdit = false, existingImages = []}: ImageUploaderProps) {

    const mainDivStyle = {  
        border: '2px dashed #d1d5db',
        borderRadius:'12px',
        display: 'flex',
        flexWrap: 'wrap' as const,
        padding:'20px',
        gap: "16px",
        minHeight: "280px",
        backgroundColor: '#f9fafb',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        position: 'relative' as const,
        alignItems: 'flex-start',
        justifyContent: 'flex-start'
    };

    const emptyStateStyle = {
        position: 'absolute' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center' as const,
        width: '100%',
        padding: '20px'
    };
    
    const imageContainerStyle:any = {
        width: "140px",
        height: "140px",
        position: "relative",
        border: 'none',
        borderRadius: '10px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    };
    
    const imageStyle:any = {
        objectFit: "cover",
        width: "100%",
        height: "100%",
        borderRadius: "10px",
    };
    
    const iconButtonStyle:any = {
        position: "absolute",
        top: "8px",
        right: "8px",
        backgroundColor: "rgba(239, 68, 68, 0.9)",
        borderRadius: "8px",
        padding: "4px",
        transition: 'all 0.2s ease'
    };

    const [imageData, setImageData] = useState<ImageData[]>([]);
    const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);

    // Initialize images when in edit mode
    useEffect(() => {
        if (isEdit && existingImages.length > 0) {
            const initialImages: ImageData[] = existingImages.map(img => ({
                preview: img.image,
                isExisting: true,
                existingId: img.id
            }));
            setImageData(initialImages);
        }
    }, [isEdit, existingImages]);

    // Update parent component with current state
    useEffect(() => {
        const newFiles = imageData.filter(img => !img.isExisting && img.file).map(img => img.file);
        const keptExistingIds = imageData.filter(img => img.isExisting).map(img => img.existingId);
        
        setFileImages({
            newImages: newFiles,
            deletedImageIds: deletedImageIds,
            keptExistingIds: keptExistingIds
        });
    }, [imageData, deletedImageIds]);

    function handleDragOver(event) {
        event.preventDefault();
    }

    function handleDrop(event) {
        event.preventDefault();
        const files = event.dataTransfer.files;
        processFiles(files);
    }

    function handleFileChange(event) {
        processFiles(event.target.files);
    }

    function processFiles(files) {
        const filesArray = Array.from(files) as File[];
        const validFiles = filesArray.filter((file: File) => file.type.startsWith('image/'));
        
        let processedCount = 0;
        const newImagesData: ImageData[] = [];

        validFiles.forEach((file: File) => {
            const reader = new FileReader();
            
            reader.onloadend = () => {
                newImagesData.push({
                    preview: reader.result as string,
                    isExisting: false,
                    file: file
                });
                
                processedCount++;
                
                // When all files have been processed, update state
                if (processedCount === validFiles.length) {
                    setImageData(prevImages => [...prevImages, ...newImagesData]);
                }
            };
            
            reader.readAsDataURL(file);
        });
    }

    const handleDelete = (indexToDelete: number) => {
        const imageToDelete = imageData[indexToDelete];
        
        // If it's an existing image, add its ID to deletedImageIds
        if (imageToDelete.isExisting && imageToDelete.existingId) {
            setDeletedImageIds(prev => [...prev, imageToDelete.existingId!]);
        }
        
        // Remove from imageData array
        setImageData(prevImages => prevImages.filter((_, index) => index !== indexToDelete));
    }


  return (
    <div>
      <input type="file" onChange={handleFileChange} multiple id='file_input' className='d-none' accept='image/*'/>
      <div 
        onClick={() => {document.getElementById('file_input')?.click()}} 
        onDragOver={handleDragOver} 
        onDrop={handleDrop} 
        style={mainDivStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#9ca3af';
          e.currentTarget.style.backgroundColor = '#f3f4f6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#d1d5db';
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
      >
        {imageData.length === 0 && (
          <div style={emptyStateStyle}>
            <CloudUploadIcon style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '12px' }} />
            <p style={{ 
              color: '#6b7280', 
              fontSize: '15px', 
              margin: '0 0 6px 0',
              fontWeight: 500
            }}>
              Drop files here or click to upload
            </p>
            <p style={{ 
              color: '#9ca3af', 
              fontSize: '13px', 
              margin: '0'
            }}>
              Supports: JPG, PNG, GIF, WebP
            </p>
          </div>
        )}
        {imageData.map((imageItem, index) => (
          <div 
            style={imageContainerStyle} 
            key={imageItem.isExisting ? `existing-${imageItem.existingId}` : `new-${index}`}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
            }}
          >
            <img
              className="fade-in-image"
              style={imageStyle}
              src={imageItem.preview}
              alt={`Upload ${index + 1}`}
            />
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              style={iconButtonStyle}
            >
              <IconButton
                aria-label="delete"
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDelete(index);
                }}
                onMouseEnter={(e) => {
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.style.backgroundColor = 'rgba(220, 38, 38, 1)';
                    e.currentTarget.parentElement.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
                    e.currentTarget.parentElement.style.transform = 'scale(1)';
                  }
                }}
              >
                <DeleteIcon style={{ color: "white", fontSize: '18px' }} />
              </IconButton>
            </Stack>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ImageUploader;
