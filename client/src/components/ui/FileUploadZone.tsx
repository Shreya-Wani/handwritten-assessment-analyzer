import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle, Trash2, AlertCircle } from 'lucide-react';

interface FileUploadZoneProps {
  label: string;
  description: string;
  themeColor: 'orange' | 'blue';
  selectedFile: File | null;
  onFileSelected: (file: File) => void;
  onFileRemoved: () => void;
  supportedFormats?: string;
  maxSizeMB: number;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  label,
  description,
  themeColor,
  selectedFile,
  onFileSelected,
  onFileRemoved,
  supportedFormats = "PDF, PNG, JPG",
  maxSizeMB
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const themeClasses = {
    orange: {
      border: 'border-orange-200 hover:border-orange-400 bg-orange-50/30',
      iconBg: 'bg-orange-100 text-orange-600',
      text: 'text-orange-700',
      borderActive: 'border-orange-500 bg-orange-50/80',
      fileIcon: 'text-orange-500',
      progress: 'bg-orange-500'
    },
    blue: {
      border: 'border-blue-200 hover:border-blue-400 bg-blue-50/30',
      iconBg: 'bg-blue-100 text-blue-600',
      text: 'text-blue-700',
      borderActive: 'border-blue-500 bg-blue-50/80',
      fileIcon: 'text-blue-500',
      progress: 'bg-blue-500'
    }
  }[themeColor];

  const validateFile = (file: File): boolean => {
    setError(null);
    
    // Check file size
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSizeMB) {
      setError(`File size exceeds the limit of ${maxSizeMB}MB.`);
      return false;
    }

    // Check file extension/type (accept pdf, images)
    const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension) && !file.type.startsWith('image/')) {
      setError(`Unsupported file format. Please upload PDF or images.`);
      return false;
    }

    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-baseline">
        <label className="text-sm font-semibold text-slate-800">{label}</label>
        <span className="text-[10px] text-slate-400 font-medium">Max {maxSizeMB}MB</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,image/png,image/jpeg,image/jpg"
        onChange={handleFileChange}
      />

      {!selectedFile ? (
        /* Empty Upload Dropzone */
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[220px] ${
            isDragActive ? themeClasses.borderActive : themeClasses.border
          }`}
        >
          <div className={`p-4 rounded-full mb-4 ${themeClasses.iconBg} transition-transform duration-200 hover:scale-105`}>
            <Upload className="h-6 w-6" />
          </div>

          <h3 className="text-sm font-bold text-slate-800 mb-1">
            {themeColor === 'orange' ? (
              <>Upload <span className="text-brand-orange-600">Question Paper</span></>
            ) : (
              <>Upload <span className="text-brand-blue-600">Answer Sheet</span></>
            )}
          </h3>
          <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed mb-1">
            Drag & drop file here, or <span className={`underline ${themeClasses.text} font-medium`}>browse</span>
          </p>
          <p className="text-[11px] text-slate-400 max-w-[240px] leading-normal mb-3">
            {description}
          </p>
          <div className="text-[10px] font-semibold tracking-wider text-slate-400 bg-slate-100/80 px-2 py-0.5 rounded uppercase">
            {supportedFormats}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        /* Selected/Uploaded File Detail Card */
        <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm flex items-center justify-between gap-4 transition-all duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-3 rounded-lg ${themeClasses.iconBg} flex items-center justify-center shrink-0`}>
              <FileText className="h-6 w-6" />
            </div>
            
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate" title={selectedFile.name}>
                {selectedFile.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">{formatFileSize(selectedFile.size)}</span>
                <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Ready
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFileRemoved();
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all duration-150 shrink-0"
            title="Remove file"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
