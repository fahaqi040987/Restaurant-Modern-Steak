package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// UploadHandler handles file upload operations
type UploadHandler struct {
	uploadDir string
}

// NewUploadHandler creates a new upload handler
func NewUploadHandler(uploadDir string) *UploadHandler {
	return &UploadHandler{uploadDir: uploadDir}
}

// UploadResponse represents the response after a successful upload
type UploadResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	URL     string `json:"url,omitempty"`
	Error   string `json:"error,omitempty"`
}

// allowedImageTypes defines the allowed MIME types for image uploads
var allowedImageTypes = map[string]bool{
	"image/jpeg": true,
	"image/jpg":  true,
	"image/png":  true,
	"image/webp": true,
	"image/gif":  true,
}

// allowedExtensions defines the allowed file extensions
var allowedExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".webp": true,
	".gif":  true,
}

// maxFileSize is the maximum allowed file size (5MB)
const maxFileSize = 5 * 1024 * 1024

// UploadProductImage handles uploading a product image
func (h *UploadHandler) UploadProductImage(c *gin.Context) {
	// Get the file from the request
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, UploadResponse{
			Success: false,
			Message: "No image file provided",
			Error:   err.Error(),
		})
		return
	}
	defer file.Close()

	// Validate file size
	if header.Size > maxFileSize {
		c.JSON(http.StatusBadRequest, UploadResponse{
			Success: false,
			Message: "File too large",
			Error:   fmt.Sprintf("Maximum file size is %d MB", maxFileSize/(1024*1024)),
		})
		return
	}

	// Validate file extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedExtensions[ext] {
		c.JSON(http.StatusBadRequest, UploadResponse{
			Success: false,
			Message: "Invalid file type",
			Error:   "Allowed types: jpg, jpeg, png, webp, gif",
		})
		return
	}

	// Validate MIME type by reading the first 512 bytes
	buffer := make([]byte, 512)
	_, err = file.Read(buffer)
	if err != nil {
		c.JSON(http.StatusInternalServerError, UploadResponse{
			Success: false,
			Message: "Failed to read file",
			Error:   err.Error(),
		})
		return
	}

	// Reset file pointer to beginning
	file.Seek(0, 0)

	// Detect content type
	contentType := http.DetectContentType(buffer)
	if !allowedImageTypes[contentType] {
		c.JSON(http.StatusBadRequest, UploadResponse{
			Success: false,
			Message: "Invalid file content",
			Error:   fmt.Sprintf("Detected type '%s' is not allowed", contentType),
		})
		return
	}

	// Create upload directory if it doesn't exist
	productsDir := filepath.Join(h.uploadDir, "products")
	if err := os.MkdirAll(productsDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, UploadResponse{
			Success: false,
			Message: "Failed to create upload directory",
			Error:   err.Error(),
		})
		return
	}

	// Generate unique filename
	filename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	filePath := filepath.Join(productsDir, filename)

	// Create the destination file
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, UploadResponse{
			Success: false,
			Message: "Failed to create file",
			Error:   err.Error(),
		})
		return
	}
	defer dst.Close()

	// Copy the uploaded file to the destination
	if _, err := io.Copy(dst, file); err != nil {
		c.JSON(http.StatusInternalServerError, UploadResponse{
			Success: false,
			Message: "Failed to save file",
			Error:   err.Error(),
		})
		return
	}

	// Generate the URL for the uploaded file
	imageURL := fmt.Sprintf("/uploads/products/%s", filename)

	c.JSON(http.StatusOK, UploadResponse{
		Success: true,
		Message: "Image uploaded successfully",
		URL:     imageURL,
	})
}

// DeleteProductImage handles deleting a product image
func (h *UploadHandler) DeleteProductImage(c *gin.Context) {
	var req struct {
		URL string `json:"url" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, UploadResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   err.Error(),
		})
		return
	}

	// Extract filename from URL
	// Expected format: /uploads/products/uuid.ext
	if !strings.HasPrefix(req.URL, "/uploads/products/") {
		c.JSON(http.StatusBadRequest, UploadResponse{
			Success: false,
			Message: "Invalid image URL",
			Error:   "URL must be a product image",
		})
		return
	}

	filename := strings.TrimPrefix(req.URL, "/uploads/products/")

	// Validate filename to prevent directory traversal
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
		c.JSON(http.StatusBadRequest, UploadResponse{
			Success: false,
			Message: "Invalid filename",
			Error:   "Invalid characters in filename",
		})
		return
	}

	filePath := filepath.Join(h.uploadDir, "products", filename)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, UploadResponse{
			Success: false,
			Message: "Image not found",
			Error:   "File does not exist",
		})
		return
	}

	// Delete the file
	if err := os.Remove(filePath); err != nil {
		c.JSON(http.StatusInternalServerError, UploadResponse{
			Success: false,
			Message: "Failed to delete image",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, UploadResponse{
		Success: true,
		Message: "Image deleted successfully",
	})
}
