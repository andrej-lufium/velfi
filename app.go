package main

import (
	"context"
	"fmt"
	"os"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// ReadFile reads a file and returns its contents as a string
func (a *App) ReadFile(path string) (string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

// WriteFile writes content to a file
func (a *App) WriteFile(path string, content string) error {
	return os.WriteFile(path, []byte(content), 0644)
}

// OpenFileDialog shows a native open file dialog and returns the selected path
func (a *App) OpenFileDialog() (string, error) {
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Open Portfolio",
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON Files (*.json)", Pattern: "*.json"},
			{DisplayName: "All Files (*.*)", Pattern: "*.*"},
		},
	})
	if err != nil {
		return "", err
	}
	return path, nil
}

// SaveFileDialog shows a native save file dialog and returns the selected path
func (a *App) SaveFileDialog() (string, error) {
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Save Portfolio As",
		DefaultFilename: "portfolio.json",
		Filters: []runtime.FileFilter{
			{DisplayName: "JSON Files (*.json)", Pattern: "*.json"},
			{DisplayName: "All Files (*.*)", Pattern: "*.*"},
		},
	})
	if err != nil {
		return "", err
	}
	return path, nil
}

// ConfirmDialog shows a Yes/No dialog and returns true if the user clicked Yes
func (a *App) ConfirmDialog(title string, message string) (bool, error) {
	result, err := runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
		Type:          runtime.QuestionDialog,
		Title:         title,
		Message:       message,
		Buttons:       []string{"Yes", "No"},
		DefaultButton: "No",
	})
	if err != nil {
		return false, err
	}
	return result == "Yes", nil
}

type Currency struct {
	Code string  `json:"code"`
	Name string  `json:"name"`
	Rate float64 `json:"rate"`
}

type response struct {
	Currencies []Currency `json:"currencies"`
}
type Currencies []Currency
// Greet returns a greeting for the given name
func (a *App) GetCurrencies(name string) *response {
	currencies := Currencies{
		{Code: "USD", Name: "US Dollar", Rate: 1.0},
		{Code: "EUR", Name: "Euro", Rate: 0.92},
		{Code: "CHF", Name: "Swiss Franc", Rate: 0.88},
	}
	runtime.LogInfo(a.ctx, fmt.Sprintf("GetCurrencies called %v", currencies))
	return &response{Currencies: currencies}
}
