package main

import (
	"log"
	"os"

	"github.com/braviz/jira-clone/internal/config"
	"github.com/braviz/jira-clone/internal/database"
	"github.com/braviz/jira-clone/internal/handlers"
	"github.com/braviz/jira-clone/internal/middleware"
	"github.com/braviz/jira-clone/internal/repository"
	"github.com/braviz/jira-clone/internal/services"
	"github.com/braviz/jira-clone/internal/setup"
	"github.com/braviz/jira-clone/internal/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	websocketMiddleware "github.com/gofiber/websocket/v2"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()
	store := setup.NewDBConfigStore(cfg.DBConfigPath, cfg.DBKeyPath)

	if cfg.DBURL == "" {
		databaseURL, err := store.Load()
		if err != nil && err != setup.ErrNotConfigured {
			log.Println("Failed to load encrypted database URL, using environment DB settings:", err)
		}
		if databaseURL != "" {
			cfg.DBURL = databaseURL
		}
	}

	// Initialize database
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Run migrations
	if err := database.Migrate(db); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	projectRepo := repository.NewProjectRepository(db)
	issueRepo := repository.NewIssueRepository(db)
	sprintRepo := repository.NewSprintRepository(db)
	commentRepo := repository.NewCommentRepository(db)
	activityRepo := repository.NewActivityRepository(db)
	labelRepo := repository.NewLabelRepository(db)
	workLogRepo := repository.NewWorkLogRepository(db)
	notificationRepo := repository.NewNotificationRepository(db)

	// Initialize WebSocket hub
	hub := websocket.NewHub()
	go hub.Run()

	// Initialize services
	authService := services.NewAuthService(userRepo, cfg.JWTSecret)
	projectService := services.NewProjectService(projectRepo, activityRepo)
	notificationService := services.NewNotificationService(notificationRepo, hub)
	issueService := services.NewIssueService(issueRepo, activityRepo, notificationService)
	sprintService := services.NewSprintService(sprintRepo, activityRepo, issueRepo)
	commentService := services.NewCommentService(commentRepo, activityRepo)
	labelService := services.NewLabelService(labelRepo, projectRepo)

	workLogService := services.NewWorkLogService(workLogRepo, issueRepo)
	attachmentService := services.NewAttachmentService(db, "./uploads", activityRepo)
	issueLinkService := services.NewIssueLinkService(db)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	userHandler := handlers.NewUserHandler(userRepo)
	projectHandler := handlers.NewProjectHandler(projectService)
	issueHandler := handlers.NewIssueHandler(issueService)
	sprintHandler := handlers.NewSprintHandler(sprintService)
	commentHandler := handlers.NewCommentHandler(commentService)
	labelHandler := handlers.NewLabelHandler(labelService)
	workLogHandler := handlers.NewWorkLogHandler(workLogService)
	adminHandler := handlers.NewAdminHandler(userRepo, projectRepo, authService)
	subtaskHandler := handlers.NewSubtaskHandler(issueService)
	attachmentHandler := handlers.NewAttachmentHandler(attachmentService, "./uploads")
	activityHandler := handlers.NewActivityHandler(db)
	notificationHandler := handlers.NewNotificationHandler(notificationService)
	reportHandler := handlers.NewReportHandler(db)
	issueLinkHandler := handlers.NewIssueLinkHandler(issueLinkService)
	setupHandler := handlers.NewSetupHandler(store, cfg.DBURL != "")

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger.New())
	app.Static("/uploads", "./uploads")

	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	// API routes
	api := app.Group("/api")

	// Setup routes
	setupRoutes := api.Group("/setup")
	setupRoutes.Get("/status", setupHandler.GetStatus)
	setupRoutes.Post("/database-url", setupHandler.SaveDatabaseURL)

	// Auth routes
	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Get("/me", middleware.Protected(cfg.JWTSecret), authHandler.GetMe)

	// Protected routes
	protected := api.Group("", middleware.Protected(cfg.JWTSecret))

	// User routes
	users := protected.Group("/users")
	users.Get("/", userHandler.GetAllUsers)
	users.Get("/search", userHandler.SearchUsers)
	users.Get("/:id", userHandler.GetUserByID)

	// Project routes
	projects := protected.Group("/projects")
	projects.Get("/", projectHandler.GetAll)
	projects.Post("/", projectHandler.Create)
	projects.Get("/:id", projectHandler.GetByID)
	projects.Put("/:id", projectHandler.Update)
	projects.Delete("/:id", projectHandler.Delete)
	projects.Get("/:id/members", projectHandler.GetMembers)
	projects.Post("/:id/members", projectHandler.AddMember)
	projects.Put("/:id/members/:userId", projectHandler.UpdateMemberRole)
	projects.Delete("/:id/members/:userId", projectHandler.RemoveMember)

	// Issue routes
	issues := protected.Group("/issues")
	issues.Get("/project/:projectId", issueHandler.GetByProject)
	issues.Post("/", issueHandler.Create)
	issues.Get("/:id", issueHandler.GetByID)
	issues.Put("/:id", issueHandler.Update)
	issues.Delete("/:id", issueHandler.Delete)

	// Sprint routes
	sprints := protected.Group("/sprints")
	sprints.Get("/project/:projectId", sprintHandler.GetByProject)
	sprints.Post("/", sprintHandler.Create)
	sprints.Get("/:id", sprintHandler.GetByID)
	sprints.Put("/:id", sprintHandler.Update)
	sprints.Delete("/:id", sprintHandler.Delete)
	sprints.Post("/:id/start", sprintHandler.StartSprint)
	sprints.Post("/:id/complete", sprintHandler.CompleteSprint)

	// Comment routes
	comments := protected.Group("/comments")
	comments.Get("/issue/:issueId", commentHandler.GetByIssue)
	comments.Post("/", commentHandler.Create)
	comments.Put("/:id", commentHandler.Update)
	comments.Delete("/:id", commentHandler.Delete)

	// Label routes
	labels := protected.Group("/labels")
	labels.Get("/project/:projectId", labelHandler.GetLabelsByProject)
	labels.Post("/", labelHandler.CreateLabel)
	labels.Get("/:id", labelHandler.GetLabel)
	labels.Put("/:id", labelHandler.UpdateLabel)
	labels.Delete("/:id", labelHandler.DeleteLabel)
	labels.Get("/issue/:issueId", labelHandler.GetLabelsByIssue)
	labels.Post("/issue/:issueId", labelHandler.AddLabelToIssue)
	labels.Delete("/issue/:issueId/:labelId", labelHandler.RemoveLabelFromIssue)

	// Work log routes
	worklogs := protected.Group("/worklogs")
	worklogs.Get("/issue/:issueId", workLogHandler.GetWorkLogsByIssue)
	worklogs.Get("/user/me", workLogHandler.GetWorkLogsByUser)
	worklogs.Post("/", workLogHandler.CreateWorkLog)
	worklogs.Get("/:id", workLogHandler.GetWorkLog)
	worklogs.Put("/:id", workLogHandler.UpdateWorkLog)
	worklogs.Delete("/:id", workLogHandler.DeleteWorkLog)
	worklogs.Put("/issue/:issueId/estimate", workLogHandler.UpdateIssueEstimatedTime)
	worklogs.Get("/issue/:issueId/total", workLogHandler.GetTotalTimeSpent)
	worklogs.Get("/issue/:issueId/remaining", workLogHandler.GetRemainingTime)

	// Admin routes (requires admin role)
	admin := protected.Group("/admin")
	admin.Get("/users", adminHandler.GetAllUsers)
	admin.Post("/users", adminHandler.CreateUser)
	admin.Put("/users/:id", adminHandler.UpdateUser)
	admin.Put("/users/:id/role", adminHandler.UpdateUserRole)
	admin.Put("/users/:id/password", adminHandler.ResetUserPassword)
	admin.Post("/users/:id/toggle-status", adminHandler.ToggleUserStatus)
	admin.Delete("/users/:id", adminHandler.DeleteUser)
	admin.Get("/stats/users", adminHandler.GetUserStats)
	admin.Get("/projects", adminHandler.GetAllProjects)
	admin.Post("/projects", adminHandler.CreateProject)
	admin.Put("/projects/:id", adminHandler.UpdateProject)
	admin.Get("/stats/projects", adminHandler.GetProjectStats)
	admin.Delete("/projects/:id", adminHandler.DeleteProject)

	// Subtask routes
	subtasks := protected.Group("/subtasks")
	subtasks.Get("/issue/:issueId", subtaskHandler.GetSubtasks)
	subtasks.Post("/issue/:issueId", subtaskHandler.CreateSubtask)
	subtasks.Put("/:subtaskId/status", subtaskHandler.UpdateSubtaskStatus)
	subtasks.Delete("/:subtaskId", subtaskHandler.DeleteSubtask)
	subtasks.Get("/issue/:issueId/progress", subtaskHandler.GetSubtaskProgress)

	// Attachment routes
	attachments := protected.Group("/attachments")
	attachments.Post("/issue/:issueId", attachmentHandler.Upload)
	attachments.Delete("/:id", attachmentHandler.Delete)

	// Activity routes
	activities := protected.Group("/activity")
	activities.Get("/issue/:issueId", activityHandler.GetIssueActivity)
	activities.Get("/project/:projectId", activityHandler.GetProjectActivity)

	// Notification routes
	notifications := protected.Group("/notifications")
	notifications.Get("/", notificationHandler.GetMyNotifications)
	notifications.Put("/read-all", notificationHandler.MarkAllAsRead)
	notifications.Put("/:id/read", notificationHandler.MarkAsRead)
	notifications.Delete("/:id", notificationHandler.DeleteNotification)

	// Report routes
	reports := protected.Group("/reports")
	reports.Get("/project/:projectId/stats", reportHandler.GetProjectStats)
	reports.Get("/project/:projectId/trend", reportHandler.GetIssuesTrend)
	reports.Get("/project/:projectId/comprehensive", reportHandler.GetComprehensiveStats)
	reports.Get("/project/:projectId/team", reportHandler.GetTeamPerformance)
	reports.Get("/sprint/:sprintId/burndown", reportHandler.GetBurnDown)

	// Issue Link routes
	links := protected.Group("/links")
	links.Post("/", issueLinkHandler.CreateLink)
	links.Delete("/:id", issueLinkHandler.DeleteLink)
	links.Get("/issue/:issueId", issueLinkHandler.GetIssueLinks)

	// WebSocket route
	app.Get("/ws", websocketMiddleware.New(func(c *websocketMiddleware.Conn) {
		// Extract token from query parameter
		token := c.Query("token")
		if token == "" {
			log.Println("WebSocket: No token provided")
			c.WriteMessage(websocketMiddleware.TextMessage, []byte(`{"type":"error","data":{"message":"No authentication token"}}`))
			c.Close()
			return
		}

		// Validate token (optional: you can add JWT validation here)
		// For now, we accept any non-empty token
		websocket.HandleConnection(hub, c, token)
	}))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Server starting on port %s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
