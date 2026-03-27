package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	DBDriver       string
	DBURL          string
	DBHost         string
	DBPort         string
	DBUser         string
	DBPassword     string
	DBName         string
	DBSSLMode      string
	DBPath         string
	DBConfigPath   string
	DBKeyPath      string
	JWTSecret      string
	JWTExpiration  string
	Port           string
	Environment    string
	FrontendURL    string
	AllowedOrigins string
	MaxFileSize    int64
	UploadDir      string
}

func LoadConfig() *Config {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = os.Getenv("FRONTEND_URL")
	}

	return &Config{
		DBDriver:       getEnv("DB_DRIVER", "postgres"),
		DBURL:          getEnv("DB_URL", ""),
		DBHost:         getEnv("DB_HOST", "localhost"),
		DBPort:         getEnv("DB_PORT", "5432"),
		DBUser:         getEnv("DB_USER", "postgres"),
		DBPassword:     getEnv("DB_PASSWORD", "postgres"),
		DBName:         getEnv("DB_NAME", "jira_clone"),
		DBSSLMode:      getEnv("DB_SSLMODE", "disable"),
		DBPath:         getEnv("DB_PATH", "./jira-clone.db"),
		DBConfigPath:   getEnv("DB_CONFIG_PATH", "./.secure/database_url.enc"),
		DBKeyPath:      getEnv("DB_KEY_PATH", "./.secure/database_key.bin"),
		JWTSecret:      getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		JWTExpiration:  getEnv("JWT_EXPIRATION", "24h"),
		Port:           getEnv("PORT", "8080"),
		Environment:    getEnv("ENV", "development"),
		FrontendURL:    getEnv("FRONTEND_URL", "http://localhost:5173"),
		AllowedOrigins: allowedOrigins,
		MaxFileSize:    10485760, // 10MB
		UploadDir:      getEnv("UPLOAD_DIR", "./uploads"),
	}
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return strings.TrimSpace(value)
}
