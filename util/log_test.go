package util

import (
	"encoding/json"
	"testing"

	"github.com/evcc-io/evcc/util/logstash"
	jww "github.com/spf13/jwalterweatherman"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLogger(t *testing.T) {
	log := NewLogger("test")
	log.TRACE.Print("foo")

	require.Len(t, logstash.All(nil, jww.LevelTrace, 0), 1)
}

func TestUiWriter(t *testing.T) {
	ch := make(chan Param, 1)

	loggersMux.Lock()
	uiChan = ch
	loggersMux.Unlock()

	t.Cleanup(func() {
		loggersMux.Lock()
		uiChan = nil
		loggersMux.Unlock()
	})

	for _, tc := range []struct {
		log  func() *Logger
		want string
	}{
		{
			func() *Logger { return NewLogger("gsi") },
			`{"message":"not available","level":"error","area":"gsi"}`,
		},
		{
			func() *Logger { return NewLogger("db:5-Keller Süd") },
			`{"message":"not available","level":"error","area":"db:5-Keller Süd"}`,
		},
		{
			func() *Logger { return NewLoggerWithLoadpoint("lp-1", 1) },
			`{"message":"not available","level":"error","area":"lp-1","lp":1}`,
		},
	} {
		tc.log().ERROR.Println("not available")

		p := <-ch
		assert.Equal(t, "log", p.Key)

		b, err := json.Marshal(p.Val)
		require.NoError(t, err)
		assert.JSONEq(t, tc.want, string(b))
	}
}
