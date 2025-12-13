package handlers

import (
	"github.com/braviz/jira-clone/internal/models"
	"github.com/braviz/jira-clone/internal/repository"
	"github.com/braviz/jira-clone/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AdminHandler struct {
	userRepo    *repository.UserRepository
	projectRepo *repository.ProjectRepository
	authService *services.AuthService
}

func NewAdminHandler(userRepo *repository.UserRepository, projectRepo *repository.ProjectRepository, authService *services.AuthService) *AdminHandler {
	return &AdminHandler{
		userRepo:    userRepo,
		projectRepo: projectRepo,
		authService: authService,
	}
}

// CreateUserInput represents the input for creating a new user by admin
type CreateUserInput struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Role      string `json:"role"`
	Avatar    string `json:"avatar"`
}

// UpdateUserRoleInput represents the input for updating user role
type UpdateUserRoleInput struct {
	Role string `json:"role"`
}

// UpdateUserInput represents the input for updating user details
type UpdateUserInput struct {
	Email     string `json:"email"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Role      string `json:"role"`
	Avatar    string `json:"avatar"`
	IsActive  *bool  `json:"isActive"`
}

// UpdateProjectInput represents the input for updating project details
type UpdateProjectInput struct {
	Name        string `json:"name"`
	Key         string `json:"key"`
	Description string `json:"description"`
	OwnerID     string `json:"ownerId"`
}

// GetAllUsers returns all users with optional filters for admin
func (h *AdminHandler) GetAllUsers(c *fiber.Ctx) error {
	// Check if user is admin
	userRole := c.Locals("userRole")
	if userRole != "admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Admin access required",
		})
	}

	users, err := h.userRepo.FindAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch users",
		})
	}

	return c.JSON(users)
}

// CreateUser creates a new user (admin only)
func (h *AdminHandler) CreateUser(c *fiber.Ctx) error {
	// Check if user is admin
	userRole := c.Locals("userRole")
	if userRole != "admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Admin access required",
		})
	}

	var input CreateUserInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate required fields
	if input.Email == "" || input.Password == "" || input.FirstName == "" || input.LastName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email, password, firstName, and lastName are required",
		})
	}

	// Check if email already exists
	existingUser, _ := h.userRepo.FindByEmail(input.Email)
	if existingUser != nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "User with this email already exists",
		})
	}

	// Set default role if not provided
	if input.Role == "" {
		input.Role = "user"
	}

	// Validate role
	validRoles := map[string]bool{"admin": true, "manager": true, "user": true}
	if !validRoles[input.Role] {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid role. Must be 'admin', 'manager', or 'user'",
		})
	}

	// Register user using auth service
	registerInput := services.RegisterInput{
		Email:     input.Email,
		Password:  input.Password,
		FirstName: input.FirstName,
		LastName:  input.LastName,
	}

	authResponse, err := h.authService.Register(registerInput)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create user: " + err.Error(),
		})
	}

	user := authResponse.User

	// Update role and avatar if provided
	user.Role = input.Role
	if input.Avatar != "" {
		user.Avatar = input.Avatar
	}

	if err := h.userRepo.Update(user); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update user details",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(user)
}

// UpdateUser updates user details (admin only)
func (h *AdminHandler) UpdateUser(c *fiber.Ctx) error {
	// Check if user is admin
	userRole := c.Locals("userRole")
	if userRole != "admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Admin access required",
		})
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	var input UpdateUserInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	user, err := h.userRepo.FindByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	// Update fields if provided
	if input.Email != "" && input.Email != user.Email {
		// Check for duplicate email
		existingUser, _ := h.userRepo.FindByEmail(input.Email)
		if existingUser != nil && existingUser.ID != user.ID {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Email already in use",
			})
		}
		user.Email = input.Email
	}
	if input.FirstName != "" {
		user.FirstName = input.FirstName
	}
	if input.LastName != "" {
		user.LastName = input.LastName
	}
	if input.Role != "" {
		// Validate role
		validRoles := map[string]bool{"admin": true, "manager": true, "user": true}
		if !validRoles[input.Role] {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid role. Must be 'admin', 'manager', or 'user'",
			})
		}
		user.Role = input.Role
	}
	if input.Avatar != "" {
		user.Avatar = input.Avatar
	}
	if input.IsActive != nil {
		user.IsActive = *input.IsActive
	}

	if err := h.userRepo.Update(user); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update user",
		})
	}

	return c.JSON(user)
}

// UpdateUserRole updates only the user's role (admin only)
func (h *AdminHandler) UpdateUserRole(c *fiber.Ctx) error {
	// Check if user is admin
	userRole := c.Locals("userRole")
	if userRole != "admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Admin access required",
		})
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	var input UpdateUserRoleInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate role
	validRoles := map[string]bool{"admin": true, "manager": true, "user": true}
	if !validRoles[input.Role] {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid role. Must be 'admin', 'manager', or 'user'",
		})
	}

	user, err := h.userRepo.FindByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	user.Role = input.Role

	if err := h.userRepo.Update(user); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update user role",
		})
	}

	return c.JSON(user)
}

// ToggleUserStatus activates or deactivates a user (admin only)
func (h *AdminHandler) ToggleUserStatus(c *fiber.Ctx) error {
	// Check if user is admin
	userRole := c.Locals("userRole")
	if userRole != "admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Admin access required",
		})
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	user, err := h.userRepo.FindByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	// Toggle active status
	user.IsActive = !user.IsActive

	if err := h.userRepo.Update(user); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update user status",
		})
	}

	return c.JSON(fiber.Map{
		"message":  "User status updated",
		"isActive": user.IsActive,
		"user":     user,
	})
}

// DeleteUser soft-deletes a user by deactivating them (admin only)
func (h *AdminHandler) DeleteUser(c *fiber.Ctx) error {
	// Check if user is admin
	userRole := c.Locals("userRole")
	if userRole != "admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Admin access required",
		})
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	// Get the current admin user ID
	currentUserID := c.Locals("userId")
	if currentUserID == id.String() {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot delete your own account",
		})
	}

	user, err := h.userRepo.FindByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	// Soft delete by deactivating
	user.IsActive = false

	if err := h.userRepo.Update(user); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete user",
		})
	}

	return c.JSON(fiber.Map{
		"message": "User deleted successfully",
	})
}

// GetUserStats returns user statistics (admin only)
func (h *AdminHandler) GetUserStats(c *fiber.Ctx) error {
	// Check if user is admin
	userRole := c.Locals("userRole")
	if userRole != "admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Admin access required",
		})
	}

	users, err := h.userRepo.FindAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch users",
		})
	}

	totalUsers := len(users)
	activeUsers := 0
	adminCount := 0
	managerCount := 0
	regularUsers := 0

	for _, user := range users {
		if user.IsActive {
			activeUsers++
		}
		switch user.Role {
		case "admin":
			adminCount++
		case "manager":
			managerCount++
		default:
			regularUsers++
		}
	}

	return c.JSON(fiber.Map{
		"totalUsers":    totalUsers,
		"activeUsers":   activeUsers,
		"inactiveUsers": totalUsers - activeUsers,
		"byRole": fiber.Map{
			"admins":   adminCount,
			"managers": managerCount,
			"users":    regularUsers,
		},
	})
}

// GetAllProjects returns all projects for admin
func (h *AdminHandler) GetAllProjects(c *fiber.Ctx) error {
	// Check if user is admin
	userRole := c.Locals("userRole")
	if userRole != "admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Admin access required",
		})
	}

	projects, err := h.projectRepo.FindAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch projects",
		})
	}

	return c.JSON(projects)
}

// UpdateProject updates project details (admin only)
func (h *AdminHandler) UpdateProject(c *fiber.Ctx) error {
	// Check if user is admin
	userRole := c.Locals("userRole")
	if userRole != "admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Admin access required",
		})
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid project ID",
		})
	}

	var input UpdateProjectInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	project, err := h.projectRepo.FindByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Project not found",
		})
	}

	// Update fields
	if input.Name != "" {
		project.Name = input.Name
	}
	if input.Key != "" {
		project.Key = input.Key
	}
	if input.Description != "" {
		project.Description = input.Description
	}
	if input.OwnerID != "" {
		newOwnerID, err := uuid.Parse(input.OwnerID)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid Owner ID",
			})
		}

		// Validate new owner exists
		owner, err := h.userRepo.FindByID(newOwnerID)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "New owner not found",
			})
		}

		project.OwnerID = newOwnerID
		project.Owner = *owner

		// Add as member if not already
		member := &models.ProjectMember{
			ProjectID: project.ID,
			UserID:    newOwnerID,
			Role:      "owner",
		}
		// Try to add member, ignore if duplicte (logic in repo should ideally handle this, typically "first or create")
		// ProjectRepo.AddMember is just Create. We might want to check existence or use upsert.
		// For now simple create, let it fail silently or we check explicitly.
		// Actually, let's keep it simple.
		_ = h.projectRepo.AddMember(member)
	}

	if err := h.projectRepo.Update(project); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update project",
		})
	}

	return c.JSON(project)
}

// CreateProjectInput represents the input for creating a new project by admin
type CreateProjectInput struct {
	Name        string `json:"name"`
	Key         string `json:"key"`
	Description string `json:"description"`
	OwnerID     string `json:"ownerId"`
}

// CreateProject creates a new project (admin only)
func (h *AdminHandler) CreateProject(c *fiber.Ctx) error {
	// Check if user is admin
	userRole := c.Locals("userRole")
	if userRole != "admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Admin access required",
		})
	}

	var input CreateProjectInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate required fields
	if input.Name == "" || input.Key == "" || input.OwnerID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Name, Key, and OwnerID are required",
		})
	}

	// Check if project key already exists
	existingProject, _ := h.projectRepo.FindByKey(input.Key)
	if existingProject != nil && existingProject.ID != uuid.Nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "Project with this key already exists",
		})
	}

	ownerID, err := uuid.Parse(input.OwnerID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid Owner ID",
		})
	}

	// Check if owner exists
	owner, err := h.userRepo.FindByID(ownerID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Owner not found",
		})
	}

	project := &models.Project{
		Name:        input.Name,
		Key:         input.Key,
		Description: input.Description,
		OwnerID:     ownerID,
		Owner:       *owner,
	}

	if err := h.projectRepo.Create(project); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create project",
		})
	}

	// Add owner as member
	member := &models.ProjectMember{
		ProjectID: project.ID,
		UserID:    ownerID,
		Role:      "owner",
	}
	_ = h.projectRepo.AddMember(member)

	return c.Status(fiber.StatusCreated).JSON(project)
}

// GetProjectStats returns project statistics (admin only)
func (h *AdminHandler) GetProjectStats(c *fiber.Ctx) error {
	// Check if user is admin
	userRole := c.Locals("userRole")
	if userRole != "admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Admin access required",
		})
	}

	projects, err := h.projectRepo.FindAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch projects",
		})
	}

	totalProjects := len(projects)
	totalMembers := 0

	for _, p := range projects {
		totalMembers += len(p.Members)
	}

	return c.JSON(fiber.Map{
		"totalProjects": totalProjects,
		"totalMembers":  totalMembers,
	})
}

// DeleteProject deletes a project (admin only)
func (h *AdminHandler) DeleteProject(c *fiber.Ctx) error {
	// Check if user is admin
	userRole := c.Locals("userRole")
	if userRole != "admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Admin access required",
		})
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid project ID",
		})
	}

	if err := h.projectRepo.Delete(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete project",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Project deleted successfully",
	})
}

// ResetUserPassword resets a user's password (admin only)
func (h *AdminHandler) ResetUserPassword(c *fiber.Ctx) error {
	// Check if user is admin
	userRole := c.Locals("userRole")
	if userRole != "admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Admin access required",
		})
	}

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	var input struct {
		Password string `json:"password"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if len(input.Password) < 6 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Password must be at least 6 characters",
		})
	}

	user, err := h.userRepo.FindByID(id)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to hash password",
		})
	}

	user.Password = string(hashedPassword)

	if err := h.userRepo.Update(user); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update password",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Password reset successfully",
	})
}
