/**
此文件为旧版支付设置文件，如需增加新的参数、变量等，请在 payment_setting.go 中添加
This file is the old version of the payment settings file. If you need to add new parameters, variables, etc., please add them in payment_setting.go
*/

package operation_setting

import (
	"strings"

	"github.com/QuantumNous/new-api/common"
)

// EpayGateway represents a single EPay-protocol-compatible payment gateway.
type EpayGateway struct {
	Id         string `json:"id"`
	Name       string `json:"name"`
	PayAddress string `json:"pay_address"`
	EpayId     string `json:"epay_id"`
	EpayKey    string `json:"epay_key"`
}

// EpayGateways holds all configured EPay gateways. Operators can add multiple
// gateways; each payment method selects which gateway to use via gateway_id.
var EpayGateways = []EpayGateway{}

// Legacy single-gateway variables — kept as migration source only.
var PayAddress = ""
var CustomCallbackAddress = ""
var EpayId = ""
var EpayKey = ""
var Price = 7.3
var MinTopUp = 1
var USDExchangeRate = 7.3

var PayMethods = []map[string]string{
	{
		"name": "支付宝",
		"icon": "SiAlipay",
		"type": "alipay",
	},
	{
		"name": "微信",
		"icon": "SiWechat",
		"type": "wxpay",
	},
	{
		"name":      "自定义1",
		"icon":      "LuCreditCard",
		"type":      "custom1",
		"min_topup": "50",
	},
}

func UpdatePayMethodsByJsonString(jsonString string) error {
	PayMethods = make([]map[string]string, 0)
	return common.Unmarshal([]byte(jsonString), &PayMethods)
}

func PayMethods2JsonString() string {
	jsonBytes, err := common.Marshal(PayMethods)
	if err != nil {
		return "[]"
	}
	return string(jsonBytes)
}

func ContainsPayMethod(method string) bool {
	for _, payMethod := range PayMethods {
		if payMethod["type"] == method {
			return true
		}
	}
	return false
}

// GetEpayGatewayById returns the gateway with the given id, or nil if not found.
func GetEpayGatewayById(id string) *EpayGateway {
	for i := range EpayGateways {
		if EpayGateways[i].Id == id {
			return &EpayGateways[i]
		}
	}
	return nil
}

// GetFirstEpayGateway returns the first configured gateway, or nil if none.
func GetFirstEpayGateway() *EpayGateway {
	if len(EpayGateways) == 0 {
		return nil
	}
	return &EpayGateways[0]
}

// GetPayMethodGatewayId returns the gateway_id associated with the given
// payment method type. Returns "" if not specified or method not found.
func GetPayMethodGatewayId(method string) string {
	for _, payMethod := range PayMethods {
		if payMethod["type"] == method {
			return payMethod["gateway_id"]
		}
	}
	return ""
}

// UpdateEpayGatewaysByJsonString parses the JSON array of gateways. When a
// gateway has an empty epay_key, the existing key for that gateway id is
// preserved (so the frontend can omit the key when not rotating it).
func UpdateEpayGatewaysByJsonString(jsonString string) error {
	var newGateways []EpayGateway
	trimmed := strings.TrimSpace(jsonString)
	if trimmed == "" || trimmed == "[]" {
		EpayGateways = []EpayGateway{}
		return nil
	}
	if err := common.Unmarshal([]byte(jsonString), &newGateways); err != nil {
		return err
	}
	// Preserve existing keys for gateways whose key is empty in the new data.
	existingKeyById := make(map[string]string, len(EpayGateways))
	for _, g := range EpayGateways {
		existingKeyById[g.Id] = g.EpayKey
	}
	for i := range newGateways {
		if newGateways[i].EpayKey == "" {
			newGateways[i].EpayKey = existingKeyById[newGateways[i].Id]
		}
	}
	EpayGateways = newGateways
	return nil
}

func EpayGateways2JsonString() string {
	jsonBytes, err := common.Marshal(EpayGateways)
	if err != nil {
		return "[]"
	}
	return string(jsonBytes)
}

// MigrateEpayGatewaysFromLegacy populates EpayGateways from the legacy
// single-gateway variables when EpayGateways is empty. The caller is
// responsible for persisting the returned in-memory configuration.
func MigrateEpayGatewaysFromLegacy() bool {
	if len(EpayGateways) > 0 {
		return false
	}
	if strings.TrimSpace(PayAddress) == "" || strings.TrimSpace(EpayId) == "" || strings.TrimSpace(EpayKey) == "" {
		return false
	}
	EpayGateways = []EpayGateway{{
		Id:         "default",
		Name:       "Default",
		PayAddress: PayAddress,
		EpayId:     EpayId,
		EpayKey:    EpayKey,
	}}
	return true
}
