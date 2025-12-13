package handlers

import (
	"time"

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

// StatusCount represents count of issues by status
type StatusCount struct {
	Status string `json:"status"`
	Count  int64  `json:"count"`
}

// PriorityCount represents count of issues by priority
type PriorityCount struct {
	Priority string `json:"priority"`
	Count    int64  `json:"count"`
}

// AssigneeCount represents count of issues by assignee
type AssigneeCount struct {
	AssigneeID *uuid.UUID `json:"assigneeId"`
	FirstName  string     `json:"firstName"`
	LastName   string     `json:"lastName"`
	Email      string     `json:"email"`
	Count      int64      `json:"count"`
}

// TypeCount represents count of issues by type
type TypeCount struct {
	Type  string `json:"type"`
	Count int64  `json:"count"`
}

// DailyStats represents daily issue statistics
type DailyStats struct {
	Date     string `json:"date"`
	Created  int64  `json:"created"`
	Resolved int64  `json:"resolved"`
}

// SprintStats represents sprint-level statistics
type SprintStats struct {
	ID              uuid.UUID `json:"id"`
	Name            string    `json:"name"`
	Status          string    `json:"status"`
	TotalIssues     int64     `json:"totalIssues"`
	CompletedIssues int64     `json:"completedIssues"`
	TotalPoints     int64     `json:"totalPoints"`
	CompletedPoints int64     `json:"completedPoints"`
	StartDate       *string   `json:"startDate"`
	EndDate         *string   `json:"endDate"`
}

// TeamMemberStats represents stats per team member
type TeamMemberStats struct {
	UserID          uuid.UUID `json:"userId"`
	FirstName       string    `json:"firstName"`
	LastName        string    `json:"lastName"`
	Email           string    `json:"email"`
	Avatar          string    `json:"avatar"`
	AssignedIssues  int64     `json:"assignedIssues"`
	CompletedIssues int64     `json:"completedIssues"`
	InProgressCount int64     `json:"inProgressCount"`
	TotalPoints     int64     `json:"totalPoints"`
	CompletedPoints int64     `json:"completedPoints"`
	TimeLogged      int64     `json:"timeLogged"` // in minutes
}

// LabelStats represents issue count by label
type LabelStats struct {
	LabelID   uuid.UUID `json:"labelId"`
	LabelName string    `json:"labelName"`
	Color     string    `json:"color"`
	Count     int64     `json:"count"`
}

// IssueAgingBucket represents issues grouped by age
type IssueAgingBucket struct {
	Bucket string `json:"bucket"`
	Count  int64  `json:"count"`
}

// ComprehensiveStats is the full analytics response
type ComprehensiveStats struct {
	// Summary stats
	TotalIssues       int64   `json:"totalIssues"`
	OpenIssues        int64   `json:"openIssues"`
	CompletedIssues   int64   `json:"completedIssues"`
	TotalPoints       int64   `json:"totalPoints"`
	CompletedPoints   int64   `json:"completedPoints"`
	AvgResolutionTime float64 `json:"avgResolutionTime"` // in hours
	TotalTimeLogged   int64   `json:"totalTimeLogged"`   // in minutes

	// Distributions
	StatusCounts   []StatusCount   `json:"statusCounts"`
	PriorityCounts []PriorityCount `json:"priorityCounts"`
	TypeCounts     []TypeCount     `json:"typeCounts"`

	// Trend data (last 30 days)
	DailyTrend []DailyStats `json:"dailyTrend"`

	// Team performance
	TeamStats []TeamMemberStats `json:"teamStats"`

	// Assignee distribution
	AssigneeCounts []AssigneeCount `json:"assigneeCounts"`

	// Sprint stats
	SprintStats []SprintStats `json:"sprintStats"`

	// Label distribution
	LabelStats []LabelStats `json:"labelStats"`

	// Issue aging
	AgingBuckets []IssueAgingBucket `json:"agingBuckets"`

	// Velocity (last 4 weeks)
	WeeklyVelocity []WeeklyVelocity `json:"weeklyVelocity"`

	// Recent activity counts
	RecentCreated  int64 `json:"recentCreated"`  // last 7 days
	RecentResolved int64 `json:"recentResolved"` // last 7 days
}

// WeeklyVelocity represents weekly issue velocity
type WeeklyVelocity struct {
	Week            string `json:"week"`
	Created         int64  `json:"created"`
	Completed       int64  `json:"completed"`
	PointsCompleted int64  `json:"pointsCompleted"`
}

func (h *ReportHandler) GetProjectStats(c *fiber.Ctx) error {
	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	// 1. Issues by Status
	var statusCounts []StatusCount
	if err := h.db.Model(&models.Issue{}).
		Where("project_id = ?", projectID).
		Select("status, count(*) as count").
		Group("status").
		Scan(&statusCounts).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get status counts"})
	}

	// 2. Issues by Priority
	var priorityCounts []PriorityCount
	if err := h.db.Model(&models.Issue{}).
		Where("project_id = ?", projectID).
		Select("priority, count(*) as count").
		Group("priority").
		Scan(&priorityCounts).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get priority counts"})
	}

	// 3. Issues by Assignee
	var assigneeCounts []AssigneeCount
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

func (h *ReportHandler) GetComprehensiveStats(c *fiber.Ctx) error {
	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	stats := ComprehensiveStats{}
	now := time.Now()

	// ============ SUMMARY STATS ============

	// Total issues
	if err := h.db.Model(&models.Issue{}).
		Where("project_id = ?", projectID).
		Count(&stats.TotalIssues).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get total issues"})
	}

	// Open issues (not done)
	if err := h.db.Model(&models.Issue{}).
		Where("project_id = ? AND status != ?", projectID, "done").
		Count(&stats.OpenIssues).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get open issues"})
	}

	// Completed issues
	if err := h.db.Model(&models.Issue{}).
		Where("project_id = ? AND status = ?", projectID, "done").
		Count(&stats.CompletedIssues).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to get completed issues"})
	}

	// Total story points
	var totalPoints struct {
		Sum int64
	}
	if err := h.db.Model(&models.Issue{}).
		Select("COALESCE(SUM(story_points), 0) as sum").
		Where("project_id = ?", projectID).
		Scan(&totalPoints).Error; err == nil {
		stats.TotalPoints = totalPoints.Sum
	}

	// Completed story points
	var completedPoints struct {
		Sum int64
	}
	if err := h.db.Model(&models.Issue{}).
		Select("COALESCE(SUM(story_points), 0) as sum").
		Where("project_id = ? AND status = ?", projectID, "done").
		Scan(&completedPoints).Error; err == nil {
		stats.CompletedPoints = completedPoints.Sum
	}

	// Total time logged
	var timeLogged struct {
		Sum int64
	}
	if err := h.db.Model(&models.Issue{}).
		Select("COALESCE(SUM(time_spent), 0) as sum").
		Where("project_id = ?", projectID).
		Scan(&timeLogged).Error; err == nil {
		stats.TotalTimeLogged = timeLogged.Sum
	}

	// Average resolution time (in hours)
	var avgResolution struct {
		Avg float64
	}
	h.db.Raw(`
		SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600), 0) as avg
		FROM issues 
		WHERE project_id = ? AND status = 'done'
	`, projectID).Scan(&avgResolution)
	stats.AvgResolutionTime = avgResolution.Avg

	// ============ STATUS DISTRIBUTION ============
	if err := h.db.Model(&models.Issue{}).
		Where("project_id = ?", projectID).
		Select("status, count(*) as count").
		Group("status").
		Scan(&stats.StatusCounts).Error; err != nil {
		stats.StatusCounts = []StatusCount{}
	}

	// ============ PRIORITY DISTRIBUTION ============
	if err := h.db.Model(&models.Issue{}).
		Where("project_id = ?", projectID).
		Select("priority, count(*) as count").
		Group("priority").
		Scan(&stats.PriorityCounts).Error; err != nil {
		stats.PriorityCounts = []PriorityCount{}
	}

	// ============ TYPE DISTRIBUTION ============
	if err := h.db.Model(&models.Issue{}).
		Where("project_id = ?", projectID).
		Select("type, count(*) as count").
		Group("type").
		Scan(&stats.TypeCounts).Error; err != nil {
		stats.TypeCounts = []TypeCount{}
	}

	// ============ DAILY TREND (Last 30 days) ============
	thirtyDaysAgo := now.AddDate(0, 0, -30)
	var dailyTrend []DailyStats

	h.db.Raw(`
		WITH dates AS (
			SELECT generate_series(
				?::date,
				?::date,
				'1 day'::interval
			)::date as day
		),
		created_counts AS (
			SELECT DATE(created_at) as day, COUNT(*) as count
			FROM issues
			WHERE project_id = ? AND created_at >= ?
			GROUP BY DATE(created_at)
		),
		resolved_counts AS (
			SELECT DATE(updated_at) as day, COUNT(*) as count
			FROM issues
			WHERE project_id = ? AND status = 'done' AND updated_at >= ?
			GROUP BY DATE(updated_at)
		)
		SELECT 
			TO_CHAR(d.day, 'YYYY-MM-DD') as date,
			COALESCE(c.count, 0) as created,
			COALESCE(r.count, 0) as resolved
		FROM dates d
		LEFT JOIN created_counts c ON c.day = d.day
		LEFT JOIN resolved_counts r ON r.day = d.day
		ORDER BY d.day
	`, thirtyDaysAgo, now, projectID, thirtyDaysAgo, projectID, thirtyDaysAgo).Scan(&dailyTrend)
	stats.DailyTrend = dailyTrend

	// ============ ASSIGNEE DISTRIBUTION ============
	if err := h.db.Table("issues").
		Select("issues.assignee_id, users.first_name, users.last_name, users.email, count(issues.id) as count").
		Joins("LEFT JOIN users ON users.id = issues.assignee_id").
		Where("issues.project_id = ?", projectID).
		Group("issues.assignee_id, users.first_name, users.last_name, users.email").
		Scan(&stats.AssigneeCounts).Error; err != nil {
		stats.AssigneeCounts = []AssigneeCount{}
	}

	// ============ TEAM STATS ============
	var teamStats []TeamMemberStats
	h.db.Raw(`
		SELECT 
			u.id as user_id,
			u.first_name,
			u.last_name,
			u.email,
			u.avatar,
			COUNT(i.id) as assigned_issues,
			COUNT(CASE WHEN i.status = 'done' THEN 1 END) as completed_issues,
			COUNT(CASE WHEN i.status = 'in_progress' THEN 1 END) as in_progress_count,
			COALESCE(SUM(i.story_points), 0) as total_points,
			COALESCE(SUM(CASE WHEN i.status = 'done' THEN i.story_points ELSE 0 END), 0) as completed_points,
			COALESCE(SUM(i.time_spent), 0) as time_logged
		FROM users u
		INNER JOIN project_members pm ON pm.user_id = u.id
		LEFT JOIN issues i ON i.assignee_id = u.id AND i.project_id = ?
		WHERE pm.project_id = ?
		GROUP BY u.id, u.first_name, u.last_name, u.email, u.avatar
		ORDER BY completed_issues DESC
	`, projectID, projectID).Scan(&teamStats)
	stats.TeamStats = teamStats

	// ============ SPRINT STATS ============
	var sprintStats []SprintStats
	h.db.Raw(`
		SELECT 
			s.id,
			s.name,
			s.status,
			COUNT(i.id) as total_issues,
			COUNT(CASE WHEN i.status = 'done' THEN 1 END) as completed_issues,
			COALESCE(SUM(i.story_points), 0) as total_points,
			COALESCE(SUM(CASE WHEN i.status = 'done' THEN i.story_points ELSE 0 END), 0) as completed_points,
			TO_CHAR(s.start_date, 'YYYY-MM-DD') as start_date,
			TO_CHAR(s.end_date, 'YYYY-MM-DD') as end_date
		FROM sprints s
		LEFT JOIN issues i ON i.sprint_id = s.id
		WHERE s.project_id = ?
		GROUP BY s.id, s.name, s.status, s.start_date, s.end_date
		ORDER BY s.created_at DESC
		LIMIT 10
	`, projectID).Scan(&sprintStats)
	stats.SprintStats = sprintStats

	// ============ LABEL STATS ============
	var labelStats []LabelStats
	h.db.Raw(`
		SELECT 
			l.id as label_id,
			l.name as label_name,
			l.color,
			COUNT(il.issue_id) as count
		FROM labels l
		LEFT JOIN issue_labels il ON il.label_id = l.id
		LEFT JOIN issues i ON i.id = il.issue_id
		WHERE l.project_id = ?
		GROUP BY l.id, l.name, l.color
		ORDER BY count DESC
	`, projectID).Scan(&labelStats)
	stats.LabelStats = labelStats

	// ============ ISSUE AGING ============
	var agingBuckets []IssueAgingBucket
	h.db.Raw(`
		SELECT 
			CASE 
				WHEN EXTRACT(DAY FROM NOW() - created_at) < 2 THEN 'Fresh (< 2 days)'
				WHEN EXTRACT(DAY FROM NOW() - created_at) < 7 THEN 'Recent (2-7 days)'
				WHEN EXTRACT(DAY FROM NOW() - created_at) < 14 THEN 'Aging (8-14 days)'
				WHEN EXTRACT(DAY FROM NOW() - created_at) < 30 THEN 'Stale (15-30 days)'
				ELSE 'Critical (30+ days)'
			END as bucket,
			COUNT(*) as count
		FROM issues
		WHERE project_id = ? AND status != 'done'
		GROUP BY bucket
		ORDER BY 
			CASE bucket
				WHEN 'Fresh (< 2 days)' THEN 1
				WHEN 'Recent (2-7 days)' THEN 2
				WHEN 'Aging (8-14 days)' THEN 3
				WHEN 'Stale (15-30 days)' THEN 4
				ELSE 5
			END
	`, projectID).Scan(&agingBuckets)
	stats.AgingBuckets = agingBuckets

	// ============ WEEKLY VELOCITY (Last 4 weeks) ============
	var weeklyVelocity []WeeklyVelocity
	h.db.Raw(`
		WITH weeks AS (
			SELECT 
				DATE_TRUNC('week', d)::date as week_start
			FROM generate_series(
				CURRENT_DATE - INTERVAL '4 weeks',
				CURRENT_DATE,
				'1 week'::interval
			) d
		)
		SELECT 
			TO_CHAR(w.week_start, 'Mon DD') as week,
			COALESCE(SUM(CASE WHEN DATE_TRUNC('week', i.created_at) = w.week_start THEN 1 ELSE 0 END), 0) as created,
			COALESCE(SUM(CASE WHEN DATE_TRUNC('week', i.updated_at) = w.week_start AND i.status = 'done' THEN 1 ELSE 0 END), 0) as completed,
			COALESCE(SUM(CASE WHEN DATE_TRUNC('week', i.updated_at) = w.week_start AND i.status = 'done' THEN i.story_points ELSE 0 END), 0) as points_completed
		FROM weeks w
		LEFT JOIN issues i ON i.project_id = ?
		GROUP BY w.week_start
		ORDER BY w.week_start
	`, projectID).Scan(&weeklyVelocity)
	stats.WeeklyVelocity = weeklyVelocity

	// ============ RECENT ACTIVITY ============
	sevenDaysAgo := now.AddDate(0, 0, -7)

	// Recently created
	if err := h.db.Model(&models.Issue{}).
		Where("project_id = ? AND created_at >= ?", projectID, sevenDaysAgo).
		Count(&stats.RecentCreated).Error; err != nil {
		stats.RecentCreated = 0
	}

	// Recently resolved
	if err := h.db.Model(&models.Issue{}).
		Where("project_id = ? AND status = ? AND updated_at >= ?", projectID, "done", sevenDaysAgo).
		Count(&stats.RecentResolved).Error; err != nil {
		stats.RecentResolved = 0
	}

	return c.JSON(stats)
}

func (h *ReportHandler) GetBurnDown(c *fiber.Ctx) error {
	sprintID, err := uuid.Parse(c.Params("sprintId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid sprint ID"})
	}

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
	totalIssues := len(issues)
	completedIssues := 0

	for _, issue := range issues {
		points := 0
		if issue.StoryPoints != nil {
			points = *issue.StoryPoints
		}
		totalPoints += points
		if issue.Status == "done" {
			completedPoints += points
			completedIssues++
		}
	}

	// Calculate ideal burndown if we have dates
	var idealBurndown []fiber.Map
	var actualBurndown []fiber.Map

	if sprint.StartDate != nil && sprint.EndDate != nil {
		startDate := *sprint.StartDate
		endDate := *sprint.EndDate
		totalDays := int(endDate.Sub(startDate).Hours() / 24)

		if totalDays > 0 {
			pointsPerDay := float64(totalPoints) / float64(totalDays)

			for i := 0; i <= totalDays; i++ {
				day := startDate.AddDate(0, 0, i)
				idealBurndown = append(idealBurndown, fiber.Map{
					"date":   day.Format("2006-01-02"),
					"points": float64(totalPoints) - (pointsPerDay * float64(i)),
				})
			}
		}
	}

	return c.JSON(fiber.Map{
		"sprint":          sprint.Name,
		"sprintStatus":    sprint.Status,
		"totalPoints":     totalPoints,
		"completedPoints": completedPoints,
		"remainingPoints": totalPoints - completedPoints,
		"totalIssues":     totalIssues,
		"completedIssues": completedIssues,
		"remainingIssues": totalIssues - completedIssues,
		"idealBurndown":   idealBurndown,
		"actualBurndown":  actualBurndown,
		"completionRate":  float64(completedIssues) / float64(max(totalIssues, 1)) * 100,
	})
}

func (h *ReportHandler) GetIssuesTrend(c *fiber.Ctx) error {
	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	type DailyCount struct {
		Date  string `json:"date"`
		Count int    `json:"count"`
	}

	var trend []DailyCount

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

// GetTeamPerformance returns detailed team performance metrics
func (h *ReportHandler) GetTeamPerformance(c *fiber.Ctx) error {
	projectID, err := uuid.Parse(c.Params("projectId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	var teamStats []TeamMemberStats
	h.db.Raw(`
		SELECT 
			u.id as user_id,
			u.first_name,
			u.last_name,
			u.email,
			u.avatar,
			COUNT(i.id) as assigned_issues,
			COUNT(CASE WHEN i.status = 'done' THEN 1 END) as completed_issues,
			COUNT(CASE WHEN i.status = 'in_progress' THEN 1 END) as in_progress_count,
			COALESCE(SUM(i.story_points), 0) as total_points,
			COALESCE(SUM(CASE WHEN i.status = 'done' THEN i.story_points ELSE 0 END), 0) as completed_points,
			COALESCE((
				SELECT SUM(wl.time_spent) 
				FROM work_logs wl 
				INNER JOIN issues wi ON wi.id = wl.issue_id 
				WHERE wl.user_id = u.id AND wi.project_id = ?
			), 0) as time_logged
		FROM users u
		INNER JOIN project_members pm ON pm.user_id = u.id
		LEFT JOIN issues i ON i.assignee_id = u.id AND i.project_id = ?
		WHERE pm.project_id = ?
		GROUP BY u.id, u.first_name, u.last_name, u.email, u.avatar
		ORDER BY completed_issues DESC
	`, projectID, projectID, projectID).Scan(&teamStats)

	return c.JSON(teamStats)
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
