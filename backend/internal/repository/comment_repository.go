package repository

import (
	"github.com/braviz/jira-clone/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CommentRepository struct {
	db *gorm.DB
}

func NewCommentRepository(db *gorm.DB) *CommentRepository {
	return &CommentRepository{db: db}
}

func (r *CommentRepository) Create(comment *models.Comment) error {
	return r.db.Create(comment).Error
}

func (r *CommentRepository) FindByID(id uuid.UUID) (*models.Comment, error) {
	var comment models.Comment
	err := r.db.Preload("User").First(&comment, "id = ?", id).Error
	return &comment, err
}

func (r *CommentRepository) GetByIssue(issueID uuid.UUID) ([]models.Comment, error) {
	var comments []models.Comment
	err := r.db.
		Preload("User").
		Where("issue_id = ?", issueID).
		Order("created_at ASC").
		Find(&comments).Error
	return comments, err
}

func (r *CommentRepository) Update(comment *models.Comment) error {
	return r.db.Save(comment).Error
}

func (r *CommentRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Comment{}, "id = ?", id).Error
}
