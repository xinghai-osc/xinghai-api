package model

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
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
