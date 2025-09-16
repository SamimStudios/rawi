import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  Music, 
  Video, 
  X, 
  Download,
  Eye,
  AlertCircle 
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FileUploadFieldProps {
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  field?: any;
  disabled?: boolean;
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
  url?: string;
  lastModified: number;
}

export function FileUploadField({ value, onChange, placeholder = "Choose files or drag & drop", field, disabled = false }: FileUploadFieldProps) {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileInfo[]>(
    Array.isArray(value) ? value : (value ? [value] : [])
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />;
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeColor = (type: string) => {
    if (type.startsWith('image/')) return 'bg-green-100 text-green-800';
    if (type.startsWith('video/')) return 'bg-purple-100 text-purple-800';
    if (type.startsWith('audio/')) return 'bg-blue-100 text-blue-800';
    if (type.includes('pdf')) return 'bg-red-100 text-red-800';
    if (type.includes('document')) return 'bg-indigo-100 text-indigo-800';
    return 'bg-gray-100 text-gray-800';
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles: FileInfo[] = Array.from(fileList).map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      lastModified: file.lastModified
    }));

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    
    // For demo purposes, store file info array
    onChange(field?.datatype === 'array' ? updatedFiles : updatedFiles[0] || null);
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onChange(field?.datatype === 'array' ? updatedFiles : updatedFiles[0] || null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(false);
      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        handleFiles(droppedFiles);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const openFilePicker = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card
        className={`
          relative border-2 border-dashed transition-all duration-200 
          ${disabled 
            ? 'border-muted-foreground/10 bg-muted/20 cursor-not-allowed opacity-60' 
            : isDragging 
              ? 'border-primary bg-primary/5 scale-[1.02] cursor-pointer' 
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 cursor-pointer'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFilePicker}
      >
        <div className="p-8 text-center">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 transition-colors
            ${isDragging ? 'bg-primary/20' : 'bg-muted'}
          `}>
            <Upload className={`h-6 w-6 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          
          <h3 className="text-lg font-medium mb-2">
            {isDragging ? (t('dropFilesHere') || 'Drop files here') : (t('uploadFiles') || 'Upload Files')}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-4">
            {placeholder}
          </p>
          
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            className="pointer-events-none"
          >
            {t('chooseFiles') || 'Choose Files'}
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleInputChange}
            multiple={field?.datatype === 'array'}
            accept={field?.rules?.accept}
          />
        </div>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            {t('uploadedFiles') || 'Uploaded Files'} ({files.length})
          </h4>
          
          <div className="grid gap-2">
            {files.map((file, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center gap-3">
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    {getFileIcon(file.type)}
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getFileTypeColor(file.type)}`}
                      >
                        {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {file.url && file.type.startsWith('image/') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(file.url, '_blank');
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {file.url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          const a = document.createElement('a');
                          a.href = file.url!;
                          a.download = file.name;
                          a.click();
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      disabled={disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!disabled) {
                          removeFile(index);
                        }
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Image Preview */}
                {file.url && file.type.startsWith('image/') && (
                  <div className="mt-3">
                    <img 
                      src={file.url} 
                      alt={file.name}
                      className="max-h-32 rounded border"
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Validation Rules Display */}
      {field?.rules && Object.keys(field.rules).length > 0 && (
        <Card className="p-3 bg-muted/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="font-medium">{t('uploadRules') || 'Upload Rules'}:</div>
              {field.rules.accept && (
                <div>{t('acceptedTypes') || 'Accepted types'}: {field.rules.accept}</div>
              )}
              {field.rules.maxSize && (
                <div>{t('maxSize') || 'Max size'}: {formatFileSize(field.rules.maxSize)}</div>
              )}
              {field.rules.minFiles && (
                <div>{t('minFiles') || 'Min files'}: {field.rules.minFiles}</div>
              )}
              {field.rules.maxFiles && (
                <div>{t('maxFiles') || 'Max files'}: {field.rules.maxFiles}</div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}