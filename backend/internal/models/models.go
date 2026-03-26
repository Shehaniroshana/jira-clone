package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Password  string    `gorm:"not null" json:"-"`
	FirstName string    `gorm:"not null" json:"firstName"`
	LastName  string    `gorm:"not null" json:"lastName"`
	Avatar    string    `json:"avatar"`
	Role      string    `gorm:"default:'user'" json:"role"` // admin, user
	IsActive  bool      `gorm:"default:true" json:"isActive"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

type Project struct {
	ID          uuid.UUID       `gorm:"type:uuid;primary_key" json:"id"`
	Key         string          `gorm:"uniqueIndex;not null" json:"key"` // e.g., "PROJ"
	Name        string          `gorm:"not null" json:"name"`
	Description string          `json:"description"`
	Icon        string          `json:"icon"`
	Color       string          `json:"color"`
	OwnerID     uuid.UUID       `gorm:"type:uuid;not null" json:"ownerId"`
	Owner       User            `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	Members     []ProjectMember `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"members,omitempty"`
	Sprints     []Sprint        `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"sprints,omitempty"`
	Issues      []Issue         `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"issues,omitempty"`
	CreatedAt   time.Time       `json:"createdAt"`
	UpdatedAt   time.Time       `json:"updatedAt"`
}

func (p *Project) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

type ProjectMember struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	ProjectID uuid.UUID `gorm:"type:uuid;not null;index" json:"projectId"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"userId"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Role      string    `gorm:"not null;default:'member'" json:"role"` // owner, admin, member
	CreatedAt time.Time `json:"createdAt"`
}

func (pm *ProjectMember) BeforeCreate(tx *gorm.DB) error {
	if pm.ID == uuid.Nil {
		pm.ID = uuid.New()
	}
	return nil
}

type Sprint struct {
	ID        uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	ProjectID uuid.UUID  `gorm:"type:uuid;not null;index" json:"projectId"`
	Name      string     `gorm:"not null" json:"name"`
	Goal      string     `json:"goal"`
	StartDate *time.Time `json:"startDate"`
	EndDate   *time.Time `json:"endDate"`
	Status    string     `gorm:"default:'planned'" json:"status"` // planned, active, completed
	Issues    []Issue    `gorm:"foreignKey:SprintID;constraint:OnDelete:SET NULL" json:"issues,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
}

func (s *Sprint) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

type Issue struct {
	ID            uuid.UUID    `gorm:"type:uuid;primary_key" json:"id"`
	ProjectID     uuid.UUID    `gorm:"type:uuid;not null;index" json:"projectId"`
	Project       Project      `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	SprintID      *uuid.UUID   `gorm:"type:uuid;index" json:"sprintId"`
	Sprint        *Sprint      `gorm:"foreignKey:SprintID;constraint:OnDelete:SET NULL" json:"sprint,omitempty"`
	ParentIssueID *uuid.UUID   `gorm:"type:uuid;index" json:"parentIssueId"`
	ParentIssue   *Issue       `gorm:"foreignKey:ParentIssueID;constraint:OnDelete:CASCADE" json:"parentIssue,omitempty"`
	SubTasks      []Issue      `gorm:"foreignKey:ParentIssueID;constraint:OnDelete:CASCADE" json:"subTasks,omitempty"`
	Key           string       `gorm:"uniqueIndex;not null" json:"key"` // e.g., "PROJ-123"
	Title         string       `gorm:"not null" json:"title"`
	Description   string       `json:"description"`
	Type          string       `gorm:"not null;default:'task'" json:"type"`       // story, task, bug, epic, subtask
	Status        string       `gorm:"not null;default:'todo'" json:"status"`     // todo, in_progress, in_review, done
	Priority      string       `gorm:"not null;default:'medium'" json:"priority"` // lowest, low, medium, high, highest
	StoryPoints   *int         `json:"storyPoints"`
	EstimatedTime int          `gorm:"default:0" json:"estimatedTime"` // in minutes
	TimeSpent     int          `gorm:"default:0" json:"timeSpent"`     // in minutes
	AssigneeID    *uuid.UUID   `gorm:"type:uuid" json:"assigneeId"`
	Assignee      *User        `gorm:"foreignKey:AssigneeID" json:"assignee,omitempty"`
	ReporterID    uuid.UUID    `gorm:"type:uuid;not null" json:"reporterId"`
	Reporter      User         `gorm:"foreignKey:ReporterID" json:"reporter,omitempty"`
	Watchers      []User       `gorm:"many2many:issue_watchers;" json:"watchers,omitempty"`
	Position      int          `gorm:"default:0" json:"position"` // For drag & drop ordering
	Labels        []Label      `gorm:"many2many:issue_labels;" json:"labels,omitempty"`
	Comments      []Comment    `gorm:"foreignKey:IssueID;constraint:OnDelete:CASCADE" json:"comments,omitempty"`
	Attachments   []Attachment `gorm:"foreignKey:IssueID;constraint:OnDelete:CASCADE" json:"attachments,omitempty"`
	WorkLogs      []WorkLog    `gorm:"foreignKey:IssueID;constraint:OnDelete:CASCADE" json:"workLogs,omitempty"`
	CreatedAt     time.Time    `json:"createdAt"`
	UpdatedAt     time.Time    `json:"updatedAt"`
}

func (i *Issue) BeforeCreate(tx *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return nil
}

type Comment struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	IssueID   uuid.UUID `gorm:"type:uuid;not null;index" json:"issueId"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"userId"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Content   string    `gorm:"not null" json:"content"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (c *Comment) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

type Attachment struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	IssueID   uuid.UUID `gorm:"type:uuid;not null;index" json:"issueId"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"userId"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	FileName  string    `gorm:"not null" json:"fileName"`
	FileURL   string    `gorm:"not null" json:"fileUrl"`
	FileSize  int64     `json:"fileSize"`
	MimeType  string    `json:"mimeType"`
	CreatedAt time.Time `json:"createdAt"`
}

func (a *Attachment) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

type ActivityLog struct {
	ID         uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	UserID     uuid.UUID  `gorm:"type:uuid;not null" json:"userId"`
	User       User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ProjectID  *uuid.UUID `gorm:"type:uuid;index" json:"projectId"`
	IssueID    *uuid.UUID `gorm:"type:uuid;index" json:"issueId"`
	Action     string     `gorm:"not null" json:"action"`     // created, updated, deleted, commented
	EntityType string     `gorm:"not null" json:"entityType"` // project, issue, sprint, comment
	EntityID   uuid.UUID  `gorm:"type:uuid;not null" json:"entityId"`
	Changes    string     `gorm:"type:text" json:"changes"` // JSON string of changes
	CreatedAt  time.Time  `json:"createdAt"`
}

func (al *ActivityLog) BeforeCreate(tx *gorm.DB) error {
	if al.ID == uuid.Nil {
		al.ID = uuid.New()
	}
	return nil
}

type Label struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	ProjectID uuid.UUID `gorm:"type:uuid;not null;index" json:"projectId"`
	Project   Project   `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE" json:"-"`
	Name      string    `gorm:"not null" json:"name"`
	Color     string    `gorm:"not null" json:"color"` // hex color code
	CreatedAt time.Time `json:"createdAt"`
}

func (l *Label) BeforeCreate(tx *gorm.DB) error {
	if l.ID == uuid.Nil {
		l.ID = uuid.New()
	}
	return nil
}

type WorkLog struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	IssueID     uuid.UUID `gorm:"type:uuid;not null;index" json:"issueId"`
	UserID      uuid.UUID `gorm:"type:uuid;not null" json:"userId"`
	User        User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	TimeSpent   int       `gorm:"not null" json:"timeSpent"` // in minutes
	Description string    `json:"description"`
	LoggedAt    time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"loggedAt"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

func (wl *WorkLog) BeforeCreate(tx *gorm.DB) error {
	if wl.ID == uuid.Nil {
		wl.ID = uuid.New()
	}
	return nil
}

type Notification struct {
	ID         uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	UserID     uuid.UUID  `gorm:"type:uuid;not null;index" json:"userId"`
	User       User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ActorID    *uuid.UUID `gorm:"type:uuid" json:"actorId"`
	Actor      *User      `gorm:"foreignKey:ActorID" json:"actor,omitempty"`
	Title      string     `gorm:"not null" json:"title"`
	Message    string     `gorm:"not null" json:"message"`
	Type       string     `gorm:"not null" json:"type"` // mention, assigned, status_change, etc.
	EntityID   *uuid.UUID `gorm:"type:uuid" json:"entityId"`
	EntityType string     `json:"entityType"` // issue, project, comment
	IsRead     bool       `gorm:"default:false" json:"isRead"`
	CreatedAt  time.Time  `json:"createdAt"`
}

func (n *Notification) BeforeCreate(tx *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}

type IssueLink struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	SourceID  uuid.UUID `gorm:"type:uuid;not null;index" json:"sourceId"`
	Source    Issue     `gorm:"foreignKey:SourceID" json:"source,omitempty"`
	TargetID  uuid.UUID `gorm:"type:uuid;not null;index" json:"targetId"`
	Target    Issue     `gorm:"foreignKey:TargetID" json:"target,omitempty"`
	Type      string    `gorm:"not null" json:"type"` // blocks, is_blocked_by, relates_to, duplicates
	CreatedAt time.Time `json:"createdAt"`
}

func (il *IssueLink) BeforeCreate(tx *gorm.DB) error {
	if il.ID == uuid.Nil {
		il.ID = uuid.New()
	}
	return nil
}
