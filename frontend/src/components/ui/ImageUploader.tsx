import * as React from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/api/client';
import type { UploadResponse } from '@/types';

interface ImageUploaderProps {
  /** Current image URL (for edit mode) */
  value?: string | null;
  /** Callback when image is uploaded */
  onChange?: (url: string | null) => void;
  /** Callback when upload fails */
  onError?: (error: string) => void;
  /** Custom class name */
  className?: string;
  /** Whether the uploader is disabled */
  disabled?: boolean;
  /** Accepted file types */
  accept?: string;
  /** Maximum file size in bytes (default: 5MB) */
  maxSize?: number;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  preview: string | null;
  isDragging: boolean;
}

export function ImageUploader({
  value,
  onChange,
  onError,
  className,
  disabled = false,
  accept = 'image/jpeg,image/png,image/gif,image/webp',
  maxSize = 5 * 1024 * 1024, // 5MB
}: ImageUploaderProps) {
  const [state, setState] = React.useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    preview: null,
    isDragging: false,
  });

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Build the full image URL
  const getImageUrl = React.useCallback((url: string | null | undefined): string | null => {
    if (!url) return null;
    // If it's already a full URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If it's a relative URL starting with /uploads, prepend the API base
    if (url.startsWith('/uploads')) {
      const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8080/api/v1';
      // Remove /api/v1 from the API URL to get the base URL
      const baseUrl = apiUrl.replace('/api/v1', '');
      return `${baseUrl}${url}`;
    }
    return url;
  }, []);

  const displayUrl = state.preview || getImageUrl(value);

  const validateFile = (file: File): string | null => {
    // Check file type
    const acceptedTypes = accept.split(',').map(t => t.trim());
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type. Accepted: ${accept}`;
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return `File too large. Maximum size: ${maxSizeMB}MB`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }));
      onError?.(validationError);
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setState(prev => ({
      ...prev,
      isUploading: true,
      progress: 0,
      error: null,
      preview: previewUrl,
    }));

    try {
      const response = await apiClient.uploadImage(file, (progress) => {
        setState(prev => ({ ...prev, progress }));
      });

      if (response.success && response.data) {
        const uploadData = response.data as UploadResponse;
        onChange?.(uploadData.url);
        setState(prev => ({
          ...prev,
          isUploading: false,
          progress: 100,
          preview: null, // Clear preview, use actual URL
        }));
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setState(prev => ({
        ...prev,
        isUploading: false,
        progress: 0,
        error: errorMessage,
        preview: null,
      }));
      onError?.(errorMessage);
      // Clean up preview URL
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !state.isUploading) {
      setState(prev => ({ ...prev, isDragging: true }));
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, isDragging: false }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, isDragging: false }));

    if (disabled || state.isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleRemove = () => {
    setState(prev => ({
      ...prev,
      preview: null,
      error: null,
    }));
    onChange?.(null);
  };

  const handleClick = () => {
    if (!disabled && !state.isUploading) {
      inputRef.current?.click();
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || state.isUploading}
      />

      {/* Drop zone / Preview area */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors cursor-pointer min-h-[200px]',
          state.isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed',
          state.isUploading && 'cursor-wait'
        )}
      >
        {displayUrl ? (
          /* Image Preview */
          <div className="relative w-full h-full min-h-[200px]">
            <img
              src={displayUrl}
              alt="Preview"
              className="w-full h-full object-contain rounded-lg max-h-[300px]"
            />
            {!state.isUploading && !disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {state.isUploading && (
              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <span className="text-sm text-muted-foreground">
                  Uploading... {state.progress}%
                </span>
                <div className="w-3/4 mt-2">
                  <Progress value={state.progress} />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Upload Prompt */
          <div className="flex flex-col items-center justify-center p-6 text-center">
            {state.isUploading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <span className="text-sm text-muted-foreground">
                  Uploading... {state.progress}%
                </span>
                <div className="w-full max-w-[200px] mt-2">
                  <Progress value={state.progress} />
                </div>
              </>
            ) : (
              <>
                <div className="rounded-full bg-muted p-3 mb-3">
                  {state.isDragging ? (
                    <Upload className="h-6 w-6 text-primary" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm font-medium mb-1">
                  {state.isDragging
                    ? 'Drop image here'
                    : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG, GIF, WebP (max {Math.round(maxSize / (1024 * 1024))}MB)
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {state.error && (
        <p className="mt-2 text-sm text-destructive">{state.error}</p>
      )}
    </div>
  );
}

export default ImageUploader;
