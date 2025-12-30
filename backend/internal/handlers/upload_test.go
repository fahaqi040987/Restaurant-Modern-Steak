package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// ========================
// T287: TestUploadImage_Success
// ========================

func TestUploadImage_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Create temp upload directory
	tempDir, err := os.MkdirTemp("", "upload_test")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	handler := NewUploadHandler(tempDir)

	// Create a valid PNG image (1x1 pixel)
	pngData := []byte{
		0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
		0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
		0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
		0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
		0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
		0x54, 0x08, 0xd7, 0x63, 0xf8, 0x00, 0x00, 0x00,
		0x02, 0x00, 0x01, 0xe5, 0x27, 0xde, 0xfc, 0x00,
		0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
		0x42, 0x60, 0x82,
	}

	// Create multipart form
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("image", "test.png")
	assert.NoError(t, err)
	_, err = part.Write(pngData)
	assert.NoError(t, err)
	writer.Close()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/upload/image", body)
	c.Request.Header.Set("Content-Type", writer.FormDataContentType())

	handler.UploadImage(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))
	assert.Equal(t, "Image uploaded successfully", response["message"])

	data := response["data"].(map[string]interface{})
	assert.NotEmpty(t, data["filename"])
	assert.Contains(t, data["url"], "/uploads/")
	assert.Equal(t, "image/png", data["mime_type"])
}

func TestUploadImage_NoFile(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tempDir, err := os.MkdirTemp("", "upload_test")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	handler := NewUploadHandler(tempDir)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/upload/image", nil)

	handler.UploadImage(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response["success"].(bool))
	assert.Equal(t, "No image file provided", response["message"])
}

// ========================
// T288: TestUploadImage_InvalidFormat
// ========================

func TestUploadImage_InvalidFormat(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tempDir, err := os.MkdirTemp("", "upload_test")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	handler := NewUploadHandler(tempDir)

	// Create a text file (invalid format)
	textData := []byte("This is not an image file")

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("image", "test.txt")
	assert.NoError(t, err)
	_, err = part.Write(textData)
	assert.NoError(t, err)
	writer.Close()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/upload/image", body)
	c.Request.Header.Set("Content-Type", writer.FormDataContentType())

	handler.UploadImage(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response["success"].(bool))
	assert.Contains(t, response["message"], "Invalid file type")
}

func TestUploadImage_FileTooLarge(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tempDir, err := os.MkdirTemp("", "upload_test")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	handler := NewUploadHandler(tempDir)
	// Override max file size for testing
	handler.maxFileSize = 100 // 100 bytes

	// Create a file larger than max size
	largeData := make([]byte, 200)
	copy(largeData[:8], []byte{0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a}) // PNG signature

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("image", "large.png")
	assert.NoError(t, err)
	_, err = part.Write(largeData)
	assert.NoError(t, err)
	writer.Close()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/upload/image", body)
	c.Request.Header.Set("Content-Type", writer.FormDataContentType())

	handler.UploadImage(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response["success"].(bool))
	assert.Contains(t, response["message"], "File too large")
}

// ========================
// T289: TestDeleteImage_Success
// ========================

func TestDeleteImage_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tempDir, err := os.MkdirTemp("", "upload_test")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	handler := NewUploadHandler(tempDir)

	// Create a test file
	testFilename := "test-image.png"
	testFilePath := filepath.Join(tempDir, testFilename)
	err = os.WriteFile(testFilePath, []byte("test content"), 0644)
	assert.NoError(t, err)

	// Verify file exists
	_, err = os.Stat(testFilePath)
	assert.NoError(t, err)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("DELETE", "/api/v1/upload/image/"+testFilename, nil)
	c.Params = gin.Params{{Key: "filename", Value: testFilename}}

	handler.DeleteImage(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))
	assert.Equal(t, "Image deleted successfully", response["message"])

	// Verify file is deleted
	_, err = os.Stat(testFilePath)
	assert.True(t, os.IsNotExist(err))
}

func TestDeleteImage_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tempDir, err := os.MkdirTemp("", "upload_test")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	handler := NewUploadHandler(tempDir)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("DELETE", "/api/v1/upload/image/nonexistent.png", nil)
	c.Params = gin.Params{{Key: "filename", Value: "nonexistent.png"}}

	handler.DeleteImage(c)

	assert.Equal(t, http.StatusNotFound, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response["success"].(bool))
	assert.Equal(t, "File not found", response["message"])
}

func TestDeleteImage_PathTraversal(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tempDir, err := os.MkdirTemp("", "upload_test")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	handler := NewUploadHandler(tempDir)

	testCases := []string{
		"../../../etc/passwd",
		"..\\..\\windows\\system32",
		"test/../../../etc/passwd",
	}

	for _, maliciousPath := range testCases {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request, _ = http.NewRequest("DELETE", "/api/v1/upload/image/"+maliciousPath, nil)
		c.Params = gin.Params{{Key: "filename", Value: maliciousPath}}

		handler.DeleteImage(c)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var response map[string]interface{}
		err = json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.False(t, response["success"].(bool))
		assert.Equal(t, "Invalid filename", response["message"])
	}
}

// TestUploadImage_JPEG tests JPEG upload
func TestUploadImage_JPEG(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tempDir, err := os.MkdirTemp("", "upload_test")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	handler := NewUploadHandler(tempDir)

	// Create a minimal JPEG file header
	jpegData := []byte{
		0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
		0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
		0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
	}
	// Pad to at least 512 bytes for content detection
	jpegData = append(jpegData, make([]byte, 512-len(jpegData))...)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("image", "test.jpg")
	assert.NoError(t, err)
	_, err = part.Write(jpegData)
	assert.NoError(t, err)
	writer.Close()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/upload/image", body)
	c.Request.Header.Set("Content-Type", writer.FormDataContentType())

	handler.UploadImage(c)

	assert.Equal(t, http.StatusOK, w.Code)
}

// TestUploadHandler_NewUploadHandler tests handler creation
func TestUploadHandler_NewUploadHandler(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "upload_test")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	handler := NewUploadHandler(tempDir)

	assert.NotNil(t, handler)
	assert.Equal(t, tempDir, handler.uploadDir)
	assert.Equal(t, int64(5*1024*1024), handler.maxFileSize)
	assert.True(t, handler.allowedTypes["image/jpeg"])
	assert.True(t, handler.allowedTypes["image/png"])
	assert.True(t, handler.allowedTypes["image/gif"])
	assert.True(t, handler.allowedTypes["image/webp"])
}

// TestUploadImage_WithoutExtension tests file without extension
func TestUploadImage_WithoutExtension(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tempDir, err := os.MkdirTemp("", "upload_test")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	handler := NewUploadHandler(tempDir)

	// Create a valid PNG image
	pngData := []byte{
		0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
		0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
		0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
		0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
		0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
		0x54, 0x08, 0xd7, 0x63, 0xf8, 0x00, 0x00, 0x00,
		0x02, 0x00, 0x01, 0xe5, 0x27, 0xde, 0xfc, 0x00,
		0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
		0x42, 0x60, 0x82,
	}

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	// File without extension
	part, err := writer.CreateFormFile("image", "noextension")
	assert.NoError(t, err)
	_, err = part.Write(pngData)
	assert.NoError(t, err)
	writer.Close()

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("POST", "/api/v1/upload/image", body)
	c.Request.Header.Set("Content-Type", writer.FormDataContentType())

	handler.UploadImage(c)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	data := response["data"].(map[string]interface{})
	// Should have .png extension from MIME type detection
	assert.Contains(t, data["filename"], ".png")
}

// TestDeleteImage_SlashInFilename tests filename with forward slash
func TestDeleteImage_SlashInFilename(t *testing.T) {
	gin.SetMode(gin.TestMode)

	tempDir, err := os.MkdirTemp("", "upload_test")
	assert.NoError(t, err)
	defer os.RemoveAll(tempDir)

	handler := NewUploadHandler(tempDir)

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request, _ = http.NewRequest("DELETE", "/api/v1/upload/image/path/to/file.png", nil)
	c.Params = gin.Params{{Key: "filename", Value: "path/to/file.png"}}

	handler.DeleteImage(c)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// Helper to create reader for large files
func createLargeReader(size int64) io.Reader {
	return io.LimitReader(bytes.NewReader(make([]byte, size)), size)
}
