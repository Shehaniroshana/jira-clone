package services

import (
	"encoding/json"
	"errors"

	"github.com/braviz/jira-clone/internal/models"
	"github.com/braviz/jira-clone/internal/repository"
	"github.com/google/uuid"
)

type CommentService struct {
	commentRepo  *repository.CommentRepository
	activityRepo *repository.ActivityRepository
}

func NewCommentService(commentRepo *repository.CommentRepository, activityRepo *repository.ActivityRepository) *CommentService {
	return &CommentService{
		commentRepo:  commentRepo,
		activityRepo: activityRepo,
	}
}

type CreateCommentInput struct {
	IssueID uuid.UUID `json:"issueId"`
	Content string    `json:"content"`
}

type UpdateCommentInput struct {
	Content string `json:"content"`
}

func (s *CommentService) Create(input CreateCommentInput, userID uuid.UUID) (*models.Comment, error) {
	comment := &models.Comment{
		IssueID: input.IssueID,
		UserID:  userID,
		Content: input.Content,
	}

	if err := s.commentRepo.Create(comment); err != nil {
		return nil, err
	}

	// Reload with relations
	comment, _ = s.commentRepo.FindByID(comment.ID)

	s.logActivity(userID, nil, &input.IssueID, "commented", "comment", comment.ID, nil)

	return comment, nil
}

func (s *CommentService) GetByIssue(issueID uuid.UUID) ([]models.Comment, error) {
	return s.commentRepo.GetByIssue(issueID)
}

func (s *CommentService) Update(id uuid.UUID, input UpdateCommentInput, userID uuid.UUID) (*models.Comment, error) {
	comment, err := s.commentRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	// Check if user is the comment author
	if comment.UserID != userID {
		return nil, errors.New("you can only edit your own comments")
	}

	oldContent := comment.Content
	comment.Content = input.Content

	if err := s.commentRepo.Update(comment); err != nil {
		return nil, err
	}

	changes := map[string]interface{}{
		"old": oldContent,
		"new": comment.Content,
	}

	s.logActivity(userID, nil, &comment.IssueID, "updated", "comment", comment.ID, changes)

	return comment, nil
}

func (s *CommentService) Delete(id uuid.UUID, userID uuid.UUID) error {
	comment, err := s.commentRepo.FindByID(id)
	if err != nil {
		return err
	}

	// Check if user is the comment author
	if comment.UserID != userID {
		return errors.New("you can only delete your own comments")
	}

	s.logActivity(userID, nil, &comment.IssueID, "deleted", "comment", comment.ID, nil)

	return s.commentRepo.Delete(id)
}

func (s *CommentService) logActivity(userID uuid.UUID, projectID *uuid.UUID, issueID *uuid.UUID, action, entityType string, entityID uuid.UUID, changes map[string]interface{}) {
	changesJSON := ""
	if changes != nil {
		bytes, _ := json.Marshal(changes)
		changesJSON = string(bytes)
	}

	activity := &models.ActivityLog{
		UserID:     userID,
		ProjectID:  projectID,
		IssueID:    issueID,
		Action:     action,
		EntityType: entityType,
		EntityID:   entityID,
		Changes:    changesJSON,
	}

	_ = s.activityRepo.Create(activity)
}
