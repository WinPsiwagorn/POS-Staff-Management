package dto

type CreateCallRequest struct {
	TableID        string `json:"table_id" validate:"required"`
	TableLabel     string `json:"table_label" validate:"required"`
	Type           string `json:"type" validate:"required"`
	SpecialRequest string `json:"special_request"`
}
type AssignCallRequest struct {
	StaffID   string `json:"staff_id" validate:"required"`
	StaffName string `json:"staff_name" validate:"required"`
}