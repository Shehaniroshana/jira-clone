package repository

import (
	"github.com/braviz/jira-clone/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ?", email).First(&user).Error
	return &user, err
}

func (r *UserRepository) FindByID(id uuid.UUID) (*models.User, error) {
	var user models.User
	err := r.db.Where("id = ?", id).First(&user).Error
	return &user, err
}

func (r *UserRepository) FindAll() ([]models.User, error) {
	var users []models.User
	err := r.db.Select("id, email, first_name, last_name, avatar, role, is_active, created_at").
		Where("is_active = ?", true).
		Order("first_name ASC").
		Find(&users).Error
	return users, err
}

func (r *UserRepository) Search(query string) ([]models.User, error) {
	var users []models.User
	searchPattern := "%" + query + "%"

	err := r.db.Select("id, email, first_name, last_name, avatar, role, is_active, created_at").
		Where("is_active = ?", true).
		Where("first_name ILIKE ? OR last_name ILIKE ? OR email ILIKE ?",
			searchPattern, searchPattern, searchPattern).
		Order("first_name ASC").
		Limit(20).
		Find(&users).Error

	return users, err
}

func (r *UserRepository) Update(user *models.User) error {
	return r.db.Save(user).Error
}

func (r *UserRepository) Count(count *int64) error {
	return r.db.Model(&models.User{}).Count(count).Error
}
