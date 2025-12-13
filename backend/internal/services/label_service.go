package services

import (
	"errors"

	"github.com/braviz/jira-clone/internal/models"
	"github.com/braviz/jira-clone/internal/repository"
	"github.com/google/uuid"
)

type LabelService struct {
	labelRepo   *repository.LabelRepository
	projectRepo *repository.ProjectRepository
}

func NewLabelService(labelRepo *repository.LabelRepository, projectRepo *repository.ProjectRepository) *LabelService {
	return &LabelService{
		labelRepo:   labelRepo,
		projectRepo: projectRepo,
	}
}

// CreateLabel creates a new label for a project
func (s *LabelService) CreateLabel(projectID uuid.UUID, name, color string) (*models.Label, error) {
	// Verify project exists
	_, err := s.projectRepo.FindByID(projectID)
	if err != nil {
		return nil, errors.New("project not found")
	}

	// Check if label with same name already exists
	existing, _ := s.labelRepo.GetLabelByName(projectID, name)
	if existing != nil {
		return nil, errors.New("label with this name already exists")
	}

	label := &models.Label{
		ProjectID: projectID,
		Name:      name,
		Color:     color,
	}

	if err := s.labelRepo.CreateLabel(label); err != nil {
		return nil, err
	}

	return label, nil
}

// GetLabelsByProject retrieves all labels for a project
func (s *LabelService) GetLabelsByProject(projectID uuid.UUID) ([]models.Label, error) {
	return s.labelRepo.GetLabelsByProject(projectID)
}

// GetLabelByID retrieves a label by ID
func (s *LabelService) GetLabelByID(id uuid.UUID) (*models.Label, error) {
	return s.labelRepo.GetLabelByID(id)
}

// UpdateLabel updates a label
func (s *LabelService) UpdateLabel(id uuid.UUID, name, color string) (*models.Label, error) {
	label, err := s.labelRepo.GetLabelByID(id)
	if err != nil {
		return nil, errors.New("label not found")
	}

	// If name is changing, check for duplicates
	if name != label.Name {
		existing, _ := s.labelRepo.GetLabelByName(label.ProjectID, name)
		if existing != nil && existing.ID != id {
			return nil, errors.New("label with this name already exists")
		}
	}

	label.Name = name
	label.Color = color

	if err := s.labelRepo.UpdateLabel(label); err != nil {
		return nil, err
	}

	return label, nil
}

// DeleteLabel deletes a label
func (s *LabelService) DeleteLabel(id uuid.UUID) error {
	_, err := s.labelRepo.GetLabelByID(id)
	if err != nil {
		return errors.New("label not found")
	}

	return s.labelRepo.DeleteLabel(id)
}

// AddLabelToIssue adds a label to an issue
func (s *LabelService) AddLabelToIssue(issueID, labelID uuid.UUID) error {
	// Verify label exists
	_, err := s.labelRepo.GetLabelByID(labelID)
	if err != nil {
		return errors.New("label not found")
	}

	return s.labelRepo.AddLabelToIssue(issueID, labelID)
}

// RemoveLabelFromIssue removes a label from an issue
func (s *LabelService) RemoveLabelFromIssue(issueID, labelID uuid.UUID) error {
	return s.labelRepo.RemoveLabelFromIssue(issueID, labelID)
}

// GetLabelsByIssue retrieves all labels for an issue
func (s *LabelService) GetLabelsByIssue(issueID uuid.UUID) ([]models.Label, error) {
	return s.labelRepo.GetLabelsByIssue(issueID)
}
