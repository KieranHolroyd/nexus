package models

import (
	"crypto/rand"
	"fmt"
)

func NewID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return fmt.Sprintf("%x", b)
}
