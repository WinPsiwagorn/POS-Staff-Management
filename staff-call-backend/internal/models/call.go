package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Call struct {
	ID primitive.ObjectID `bson:"_id,omitempty" json:"id"`

	TableID    primitive.ObjectID `bson:"table_id" json:"table_id"`
	TableLabel string             `bson:"table_label" json:"table_label"`

	Type string `bson:"type" json:"type"`

	Status string `bson:"status" json:"status"`

	SpecialRequest string `bson:"special_request,omitempty" json:"special_request,omitempty"`

	Priority int `bson:"priority" json:"priority"`

	AssignedStaffID *primitive.ObjectID `bson:"assigned_staff_id,omitempty" json:"assigned_staff_id,omitempty"`
	AssignedStaff   *string             `bson:"assigned_staff,omitempty" json:"assigned_staff,omitempty"`

	CreatedAt  time.Time  `bson:"created_at" json:"created_at"`
	AssignedAt *time.Time `bson:"assigned_at,omitempty" json:"assigned_at,omitempty"`
	ResolvedAt *time.Time `bson:"resolved_at,omitempty" json:"resolved_at,omitempty"`
}