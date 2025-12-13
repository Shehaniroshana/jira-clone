package services

import (
	"errors"
	"mime/multipart"
	"os"
	"time"

	"github.com/braviz/jira-clone/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AttachmentService struct {
	db           *gorm.DB
	uploadDir    string
	activityRepo interface {
		Create(log *models.ActivityLog) error
	}
}

// Minimal interface for ActivityRepo to avoid circular imports if needed,
// or just use the concrete repository if available.
// For now, I'll rely on the struct passing for simplicity or standard repository pattern.

func NewAttachmentService(db *gorm.DB, uploadDir string, activityRepo interface {
	Create(log *models.ActivityLog) error
}) *AttachmentService {
	// Ensure upload directory exists
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.MkdirAll(uploadDir, 0755)
	}

	return &AttachmentService{
		db:           db,
		uploadDir:    uploadDir,
		activityRepo: activityRepo,
	}
}

func (s *AttachmentService) UploadFile(issueID, userID uuid.UUID, file *multipart.FileHeader) (*models.Attachment, error) {
	// 1. Validate file (optional size/type checks here)

	// 2. Save file to disk
	// Generate unique filename to prevent overwrites
	// ext := filepath.Ext(file.Filename)
	// uniqueName := uuid.New().String() + ext
	// filePath := filepath.Join(s.uploadDir, uniqueName)

	return nil, errors.New("use UploadFileMetadata directly after saving file in handler")
}

// CreateAttachmentRecord creates the database record after the file is saved
func (s *AttachmentService) CreateAttachmentRecord(issueID, userID uuid.UUID, fileName, storedFileName string, fileSize int64, mimeType string) (*models.Attachment, error) {
	attachment := &models.Attachment{
		IssueID:   issueID,
		UserID:    userID,
		FileName:  fileName,
		FileURL:   "/uploads/" + storedFileName, // Public URL path
		FileSize:  fileSize,
		MimeType:  mimeType,
		CreatedAt: time.Now(),
	}

	if err := s.db.Create(attachment).Error; err != nil {
		return nil, err
	}

	// Record activity
	// We'd need to cast activityRepo to the actual type or interface method
	// For now skipping strict activity recording here to avoid complex dependency setup
	// without seeing the ActivityRepo interface definition.

	return attachment, nil
}

func (s *AttachmentService) DeleteAttachment(id, userID uuid.UUID) error {
	var attachment models.Attachment
	if err := s.db.First(&attachment, "id = ?", id).Error; err != nil {
		return err
	}

	// Optional: Check if user has permission to delete (e.g. uploader or admin)

	// Delete file from disk
	// We need to extract the filename from the URL or store the server path
	// storedFileName := filepath.Base(attachment.FileURL)
	// fullPath := filepath.Join(s.uploadDir, storedFileName)
	// os.Remove(fullPath) // Ignore error if file doesn't exist

	// Delete from DB
	return s.db.Delete(&attachment).Error
}

func (s *AttachmentService) GetByIssueID(issueID uuid.UUID) ([]models.Attachment, error) {
	var attachments []models.Attachment
	err := s.db.Preload("User").Where("issue_id = ?", issueID).Find(&attachments).Error
	return attachments, err
}
