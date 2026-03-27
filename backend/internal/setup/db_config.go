package setup

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	ErrNotConfigured = errors.New("database url not configured")
)

type DBConfigStore struct {
	configPath string
	keyPath    string
}

func NewDBConfigStore(configPath, keyPath string) *DBConfigStore {
	return &DBConfigStore{
		configPath: configPath,
		keyPath:    keyPath,
	}
}

func (s *DBConfigStore) IsConfigured() bool {
	_, err := os.Stat(s.configPath)
	return err == nil
}

func (s *DBConfigStore) Save(databaseURL string) error {
	databaseURL = strings.TrimSpace(databaseURL)
	if err := ValidateDatabaseURL(databaseURL); err != nil {
		return err
	}

	key, err := s.loadOrCreateKey()
	if err != nil {
		return err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return fmt.Errorf("failed to initialize encryption cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return fmt.Errorf("failed to initialize gcm: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return fmt.Errorf("failed to create nonce: %w", err)
	}

	ciphertext := gcm.Seal(nil, nonce, []byte(databaseURL), nil)
	payload := append(nonce, ciphertext...)
	encoded := base64.StdEncoding.EncodeToString(payload)

	if err := os.MkdirAll(filepath.Dir(s.configPath), 0o700); err != nil && filepath.Dir(s.configPath) != "." {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	if err := os.WriteFile(s.configPath, []byte(encoded), 0o600); err != nil {
		return fmt.Errorf("failed to persist encrypted database config: %w", err)
	}

	return nil
}

func (s *DBConfigStore) Load() (string, error) {
	raw, err := os.ReadFile(s.configPath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return "", ErrNotConfigured
		}
		return "", fmt.Errorf("failed to read encrypted database config: %w", err)
	}

	key, err := s.loadOrCreateKey()
	if err != nil {
		return "", err
	}

	data, err := base64.StdEncoding.DecodeString(strings.TrimSpace(string(raw)))
	if err != nil {
		return "", fmt.Errorf("failed to decode encrypted database config: %w", err)
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("failed to initialize encryption cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to initialize gcm: %w", err)
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", errors.New("encrypted config payload is too short")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt database config: %w", err)
	}

	url := strings.TrimSpace(string(plaintext))
	if err := ValidateDatabaseURL(url); err != nil {
		return "", err
	}

	return url, nil
}

func (s *DBConfigStore) loadOrCreateKey() ([]byte, error) {
	if key, err := os.ReadFile(s.keyPath); err == nil {
		if len(key) != 32 {
			return nil, errors.New("invalid encryption key length")
		}
		return key, nil
	}

	key := make([]byte, 32)
	if _, err := rand.Read(key); err != nil {
		return nil, fmt.Errorf("failed to generate encryption key: %w", err)
	}

	if err := os.MkdirAll(filepath.Dir(s.keyPath), 0o700); err != nil && filepath.Dir(s.keyPath) != "." {
		return nil, fmt.Errorf("failed to create key directory: %w", err)
	}

	if err := os.WriteFile(s.keyPath, key, 0o600); err != nil {
		return nil, fmt.Errorf("failed to write encryption key: %w", err)
	}

	return key, nil
}

func ValidateDatabaseURL(databaseURL string) error {
	parsed, err := url.Parse(strings.TrimSpace(databaseURL))
	if err != nil {
		return fmt.Errorf("invalid database url: %w", err)
	}

	if parsed.Scheme != "postgres" && parsed.Scheme != "postgresql" {
		return errors.New("database url must use postgres or postgresql scheme")
	}

	if parsed.Host == "" {
		return errors.New("database url must include a host")
	}

	if parsed.User == nil || parsed.User.Username() == "" {
		return errors.New("database url must include a username")
	}

	if strings.TrimPrefix(parsed.Path, "/") == "" {
		return errors.New("database url must include a database name")
	}

	return nil
}

func ValidateConnection(databaseURL string) error {
	if err := ValidateDatabaseURL(databaseURL); err != nil {
		return err
	}

	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("failed to acquire sql db handle: %w", err)
	}
	defer sqlDB.Close()

	if err := sqlDB.Ping(); err != nil {
		return fmt.Errorf("database ping failed: %w", err)
	}

	return nil
}
