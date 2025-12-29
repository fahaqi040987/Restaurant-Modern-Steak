import { useState, useCallback, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    onUpload: (file: File) => Promise<string>;
    disabled?: boolean;
    className?: string;
}

export function ImageUpload({
    value,
    onChange,
    onUpload,
    disabled = false,
    className,
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(
        async (file: File) => {
            // Validate file type
            const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
            if (!allowedTypes.includes(file.type)) {
                setError("File type not allowed. Use: JPG, PNG, WebP, or GIF");
                return;
            }

            // Validate file size (5MB)
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                setError("File too large. Maximum size is 5MB");
                return;
            }

            setError(null);
            setIsUploading(true);

            try {
                const url = await onUpload(file);
                onChange(url);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Upload failed");
            } finally {
                setIsUploading(false);
            }
        },
        [onUpload, onChange]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            if (disabled || isUploading) return;

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        },
        [disabled, isUploading, handleFile]
    );

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                handleFile(files[0]);
            }
            // Reset input so same file can be selected again
            e.target.value = "";
        },
        [handleFile]
    );

    const handleRemove = useCallback(() => {
        onChange("");
        setError(null);
    }, [onChange]);

    const handleUrlChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange(e.target.value);
            setError(null);
        },
        [onChange]
    );

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    // If there's an image, show preview
    if (value) {
        return (
            <div className={cn("space-y-2", className)}>
                <Label>Product Image</Label>
                <div className="relative group">
                    <div className="relative aspect-video w-full max-w-xs overflow-hidden rounded-lg border bg-muted">
                        <img
                            src={value.startsWith("/uploads") ? `http://localhost:8080${value}` : value}
                            alt="Product preview"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "";
                                (e.target as HTMLImageElement).alt = "Image failed to load";
                            }}
                        />
                        {!disabled && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleRemove}
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Remove
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
                <p className="text-xs text-muted-foreground truncate max-w-xs">{value}</p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-2", className)}>
            <Label>Product Image</Label>

            {/* Drag & Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={!disabled && !isUploading ? triggerFileInput : undefined}
                className={cn(
                    "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
                    isDragging && "border-primary bg-primary/5",
                    !isDragging && "border-muted-foreground/25 hover:border-primary/50",
                    (disabled || isUploading) && "cursor-not-allowed opacity-50",
                    error && "border-destructive"
                )}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    disabled={disabled || isUploading}
                    className="hidden"
                />

                {isUploading ? (
                    <>
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                    </>
                ) : (
                    <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <div className="text-center">
                            <p className="text-sm font-medium">
                                Drop image here or click to upload
                            </p>
                            <p className="text-xs text-muted-foreground">
                                JPG, PNG, WebP, GIF up to 5MB
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}

            {/* URL Input Toggle */}
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    disabled={disabled}
                >
                    <ImageIcon className="h-4 w-4 mr-1" />
                    {showUrlInput ? "Hide URL input" : "Or use image URL"}
                </Button>
            </div>

            {/* URL Input */}
            {showUrlInput && (
                <Input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={value || ""}
                    onChange={handleUrlChange}
                    disabled={disabled}
                />
            )}
        </div>
    );
}

export default ImageUpload;
