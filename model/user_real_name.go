package model

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"strconv"
	"strings"

	"gorm.io/gorm"
)

const (
	RealNameStatusPending = 0
	RealNameStatusPassed  = 1
	RealNameStatusFailed  = 2
)

type UserRealName struct {
	Id             int    `json:"id" gorm:"primaryKey"`
	UserId         int    `json:"user_id" gorm:"uniqueIndex;not null"`
	RealName       string `json:"real_name" gorm:"type:varchar(64);not null"`
	IdCardHash     string `json:"-" gorm:"type:char(64);column:id_card_hash;index;not null"`
	IdCardLastFour string `json:"id_card_last_four" gorm:"type:varchar(4);column:id_card_last_four"`
	Provider       string `json:"provider" gorm:"type:varchar(32);not null;default:'tencent_faceid'"`
	Status         int    `json:"status" gorm:"type:int;default:0;index"`
	ResultCode     string `json:"result_code" gorm:"type:varchar(64);column:result_code"`
	Description    string `json:"description" gorm:"type:varchar(255)"`
	RequestId      string `json:"request_id" gorm:"type:varchar(64);column:request_id"`
	VerifiedAt     int64  `json:"verified_at" gorm:"column:verified_at;index"`
	CreatedAt      int64  `json:"created_at" gorm:"autoCreateTime;column:created_at"`
	UpdatedAt      int64  `json:"updated_at" gorm:"autoUpdateTime;column:updated_at"`
}

func GetUserRealNameByUserId(userId int) (*UserRealName, error) {
	if userId == 0 {
		return nil, errors.New("user_id 为空")
	}
	var realName UserRealName
	err := DB.Where("user_id = ?", userId).First(&realName).Error
	return &realName, err
}

func IsIdCardHashTaken(idCardHash string, excludeUserId int) (bool, error) {
	if strings.TrimSpace(idCardHash) == "" {
		return false, nil
	}
	var count int64
	err := DB.Model(&UserRealName{}).
		Where("id_card_hash = ? AND user_id <> ? AND status = ?", idCardHash, excludeUserId, RealNameStatusPassed).
		Count(&count).Error
	return count > 0, err
}

func UpsertUserRealName(record *UserRealName) error {
	if record == nil || record.UserId == 0 {
		return errors.New("invalid real name record")
	}
	var existing UserRealName
	err := DB.Where("user_id = ?", record.UserId).First(&existing).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return DB.Create(record).Error
	}
	if err != nil {
		return err
	}
	record.Id = existing.Id
	return DB.Save(record).Error
}

// DeleteUserRealName 删除指定用户的实名认证记录。允许在用户尚未提交时调用（视为幂等）。
func DeleteUserRealName(userId int) error {
	if userId == 0 {
		return errors.New("user_id 为空")
	}
	return DB.Where("user_id = ?", userId).Delete(&UserRealName{}).Error
}

// UserRealNameWithUser 在列表中返回实名记录时附加用户名/展示名等用户信息。
type UserRealNameWithUser struct {
	UserRealName
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
}

// ListUserRealNames 分页查询实名记录，附带 username/display_name 便于管理员检索。
// keyword 非空时按 username / display_name / user_id 模糊匹配；status 非 nil 时按状态过滤。
func ListUserRealNames(keyword string, status *int, startIdx, num int) ([]*UserRealNameWithUser, int64, error) {
	var items []*UserRealNameWithUser
	var total int64

	tx := DB.Begin()
	if tx.Error != nil {
		return nil, 0, tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	query := tx.Table("user_real_names AS r").
		Select(`r.*, u.username AS username, u.display_name AS display_name`).
		Joins("LEFT JOIN users AS u ON u.id = r.user_id")

	if keyword != "" {
		like := "%" + keyword + "%"
		if userId, err := strconv.Atoi(keyword); err == nil {
			query = query.Where("u.username LIKE ? OR u.display_name LIKE ? OR r.user_id = ?", like, like, userId)
		} else {
			query = query.Where("u.username LIKE ? OR u.display_name LIKE ?", like, like)
		}
	}
	if status != nil {
		query = query.Where("r.status = ?", *status)
	}

	if err := query.Count(&total).Error; err != nil {
		tx.Rollback()
		return nil, 0, err
	}
	if err := query.Order("r.updated_at DESC").
		Limit(num).Offset(startIdx).
		Scan(&items).Error; err != nil {
		tx.Rollback()
		return nil, 0, err
	}
	if err := tx.Commit().Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func BuildIdCardHash(idCard string) string {
	sum := sha256.Sum256([]byte(strings.ToUpper(strings.TrimSpace(idCard))))
	return hex.EncodeToString(sum[:])
}

func IdCardLastFour(idCard string) string {
	idCard = strings.ToUpper(strings.TrimSpace(idCard))
	if len(idCard) <= 4 {
		return idCard
	}
	return idCard[len(idCard)-4:]
}
