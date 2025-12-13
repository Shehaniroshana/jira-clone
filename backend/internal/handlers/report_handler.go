package handlers

import (
	"github.com/braviz/jira-clone/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReportHandler struct {
	db *gorm.DB
}

func NewReportHandler(db *gorm.DB) *ReportHandler {
	return &ReportHandler{db: db}
}

func (h *ReportHandler) GetProjectStats(c *fiber.Ctx) error {
	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	// 1. Issues by Status
	type StatusCount struct {
		Status string `json:"status"`
		Count  int64  `json:"count"`
	}
	var statusCounts []StatusCount
	if err := h.db.Model(&models.Issue{}).
		Where("project_id = ?", projectID).
		Select("status, count(*) as count").
		Group("status").
		Scan(&statusCounts).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get status counts"})
	}

	// 2. Issues by Priority
	type PriorityCount struct {
		Priority string `json:"priority"`
		Count    int64  `json:"count"`
	}
	var priorityCounts []PriorityCount
	if err := h.db.Model(&models.Issue{}).
		Where("project_id = ?", projectID).
		Select("priority, count(*) as count").
		Group("priority").
		Scan(&priorityCounts).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get priority counts"})
	}

	// 3. Issues by Assignee
	type AssigneeCount struct {
		AssigneeID *uuid.UUID `json:"assigneeId"`
		FirstName  string     `json:"firstName"`
		LastName   string     `json:"lastName"`
		Count      int64      `json:"count"`
	}
	var assigneeCounts []AssigneeCount
	// Join with users to get names
	if err := h.db.Table("issues").
		Select("issues.assignee_id, users.first_name, users.last_name, count(issues.id) as count").
		Joins("LEFT JOIN users ON users.id = issues.assignee_id").
		Where("issues.project_id = ?", projectID).
		Group("issues.assignee_id, users.first_name, users.last_name").
		Scan(&assigneeCounts).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get assignee counts"})
	}

	return c.JSON(fiber.Map{
		"statusCounts":   statusCounts,
		"priorityCounts": priorityCounts,
		"assigneeCounts": assigneeCounts,
	})
}

func (h *ReportHandler) GetBurnDown(c *fiber.Ctx) error {
	sprintID, err := uuid.Parse(c.Params("sprintId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid sprint ID"})
	}

	// For a real burndown, we need historical data.
	// We can approximate "Ideal" vs "Actual" if we have start/end dates.
	// ACTUAL: Current total Story Points of issues in sprint - Story Points of DONE issues.
	// But that's just a snapshot.
	// Creating a proper burndown requires a dedicated 'SprintSnapshot' table running daily.
	// OR query the ActivityLog.
	// Let's stick to a "Sprint Velocity" metric for now (Planned vs Completed).

	var sprint models.Sprint
	if err := h.db.First(&sprint, sprintID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Sprint not found"})
	}

	var issues []models.Issue
	if err := h.db.Where("sprint_id = ?", sprintID).Find(&issues).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch issues"})
	}

	totalPoints := 0
	completedPoints := 0

	for _, issue := range issues {
		points := 0
		if issue.StoryPoints != nil {
			points = *issue.StoryPoints
		}
		totalPoints += points
		if issue.Status == "done" {
			completedPoints += points
		}
	}

	return c.JSON(fiber.Map{
		"sprint":          sprint.Name,
		"totalPoints":     totalPoints,
		"completedPoints": completedPoints,
		"remainingPoints": totalPoints - completedPoints,
	})
}

func (h *ReportHandler) GetIssuesTrend(c *fiber.Ctx) error {
	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	// Get issues created in the last 14 days
	type DailyCount struct {
		Date  string `json:"date"`
		Count int    `json:"count"`
	}

	var trend []DailyCount

	// Postgres specific query for date truncation
	// This generates a series of dates for the last 14 days and left joins with the issues table
	query := `
		SELECT 
			TO_CHAR(d.day, 'YYYY-MM-DD') as date,
			COUNT(i.id) as count
		FROM (
			SELECT generate_series(
				CURRENT_DATE - INTERVAL '13 days',
				CURRENT_DATE,
				'1 day'::interval
			)::date as day
		) d
		LEFT JOIN issues i ON 
			DATE(i.created_at) = d.day AND 
			i.project_id = ?
		GROUP BY d.day
		ORDER BY d.day
	`

	if err := h.db.Raw(query, projectID).Scan(&trend).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get issue trends"})
	}

	return c.JSON(trend)
}
