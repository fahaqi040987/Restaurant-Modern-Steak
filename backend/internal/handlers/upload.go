package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"pos-public/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// UploadHandler handles file upload operations
type UploadHandler struct {
	uploadDir    string
	maxFileSize  int64
	allowedTypes map[string]bool
}

// UploadResponse represents the response after successful upload
type UploadResponse struct {
	Filename string `json:"filename"`
	URL      string `json:"url"`
	Size     int64  `json:"size"`
	MimeType string `json:"mime_type"`
}

// NewUploadHandler creates a new upload handler
func NewUploadHandler(uploadDir string) *UploadHandler {
	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		panic(fmt.Sprintf("Failed to create upload directory: %v", err))
	}

	return &UploadHandler{
		uploadDir:   uploadDir,
		maxFileSize: 5 * 1024 * 1024, // 5MB max
		allowedTypes: map[string]bool{
			"image/jpeg": true,
			"image/jpg":  true,
			"image/png":  true,
			"image/gif":  true,
			"image/webp": true,
		},
	}
}

// UploadImage handles image file uploads
func (h *UploadHandler) UploadImage(c *gin.Context) {
	// Get the file from form data
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "No image file provided",
			Error:   stringPtr("missing_file"),
		})
		return
	}
	defer file.Close()

	// Validate file size
	if header.Size > h.maxFileSize {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: fmt.Sprintf("File too large. Maximum size is %d MB", h.maxFileSize/(1024*1024)),
			Error:   stringPtr("file_too_large"),
		})
		return
	}

	// Read first 512 bytes to detect content type
	buffer := make([]byte, 512)
	_, err = file.Read(buffer)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to read file",
			Error:   stringPtr("read_error"),
		})
		return
	}

	// Detect MIME type
	mimeType := http.DetectContentType(buffer)

	// Validate file type
	if !h.allowedTypes[mimeType] {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid file type. Allowed types: JPEG, PNG, GIF, WebP",
			Error:   stringPtr("invalid_file_type"),
		})
		return
	}

	// Reset file position to beginning
	file.Seek(0, 0)

	// Generate UUID filename with original extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if ext == "" {
		// Default extension based on MIME type
		switch mimeType {
		case "image/jpeg", "image/jpg":
			ext = ".jpg"
		case "image/png":
			ext = ".png"
		case "image/gif":
			ext = ".gif"
		case "image/webp":
			ext = ".webp"
		default:
			ext = ".jpg"
		}
	}
	newFilename := uuid.New().String() + ext

	// Create destination file
	destPath := filepath.Join(h.uploadDir, newFilename)
	destFile, err := os.Create(destPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to save file",
			Error:   stringPtr("save_error"),
		})
		return
	}
	defer destFile.Close()

	// Copy file content
	written, err := io.Copy(destFile, file)
	if err != nil {
		// Clean up on error
		os.Remove(destPath)
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to save file",
			Error:   stringPtr("copy_error"),
		})
		return
	}

	// Generate URL path
	fileURL := "/uploads/" + newFilename

	// Return success response
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Image uploaded successfully",
		Data: UploadResponse{
			Filename: newFilename,
			URL:      fileURL,
			Size:     written,
			MimeType: mimeType,
		},
	})
}

// DeleteImage handles image deletion
func (h *UploadHandler) DeleteImage(c *gin.Context) {
	filename := c.Param("filename")

	// Validate filename (prevent path traversal)
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid filename",
			Error:   stringPtr("invalid_filename"),
		})
		return
	}

	// Check if file exists
	filePath := filepath.Join(h.uploadDir, filename)
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "File not found",
			Error:   stringPtr("not_found"),
		})
		return
	}

	// Delete the file
	if err := os.Remove(filePath); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to delete file",
			Error:   stringPtr("delete_error"),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Image deleted successfully",
	})
}

// Note: stringPtr is defined in auth.go
