package services

import (
	"errors"

	"github.com/braviz/jira-clone/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type IssueLinkService struct {
	db *gorm.DB
}

func NewIssueLinkService(db *gorm.DB) *IssueLinkService {
	return &IssueLinkService{db: db}
}

func (s *IssueLinkService) CreateLink(sourceID, targetID uuid.UUID, linkType string) (*models.IssueLink, error) {
	if sourceID == targetID {
		return nil, errors.New("cannot link issue to itself")
	}

	// Check if link already exists
	var count int64
	s.db.Model(&models.IssueLink{}).
		Where("source_id = ? AND target_id = ? AND type = ?", sourceID, targetID, linkType).
		Count(&count)

	if count > 0 {
		return nil, errors.New("link already exists")
	}

	link := &models.IssueLink{
		SourceID: sourceID,
		TargetID: targetID,
		Type:     linkType,
	}

	if err := s.db.Create(link).Error; err != nil {
		return nil, err
	}

	// Preload relationships for return
	if err := s.db.Preload("Source").Preload("Target").First(link, link.ID).Error; err != nil {
		return nil, err
	}

	return link, nil
}

func (s *IssueLinkService) DeleteLink(linkID uuid.UUID) error {
	return s.db.Delete(&models.IssueLink{}, linkID).Error
}

func (s *IssueLinkService) GetIssueLinks(issueID uuid.UUID) ([]models.IssueLink, error) {
	var links []models.IssueLink
	// Get both outgoing (Source = issueID) and incoming (Target = issueID) links
	err := s.db.Preload("Source").Preload("Target").
		Where("source_id = ? OR target_id = ?", issueID, issueID).
		Find(&links).Error
	return links, err
}
