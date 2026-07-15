package operation_setting

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestGetConfiguredEpayGatewaySkipsIncompleteGateways(t *testing.T) {
	originalGateways := EpayGateways
	t.Cleanup(func() { EpayGateways = originalGateways })

	EpayGateways = []EpayGateway{
		{Id: "incomplete", PayAddress: "https://invalid.example.com", EpayId: "id"},
		{Id: "configured", PayAddress: "https://pay.example.com", EpayId: "id", EpayKey: "key"},
	}

	require.Equal(t, "configured", GetConfiguredEpayGateway("").Id)
	require.Equal(t, "configured", GetConfiguredEpayGateway("incomplete").Id)
	require.Equal(t, "configured", GetConfiguredEpayGateway("configured").Id)
}
