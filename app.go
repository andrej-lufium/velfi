package main

import (
	"context"
	"io"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// Version can be set at build time via ldflags: -ldflags "-X main.Version=1.0.0"
var Version = "0.1.0"

// App struct
type App struct {
	ctx      context.Context
	quitting bool
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

// beforeClose delegates to the frontend which checks dirty state and confirms
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	if a.quitting {
		return false
	}
	a.quitting = true
	runtime.EventsEmit(ctx, "app:beforeclose")
	return true
}

// ResetQuit allows the frontend to cancel the quit (user chose "No")
func (a *App) ResetQuit() {
	a.quitting = false
}

// GetVersion returns the application version
func (a *App) GetVersion() string {
	return Version
}

// Print triggers the browser print dialog
func (a *App) Print() {
	runtime.WindowPrint(a.ctx)
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
			{DisplayName: "Velfi Files (*.velfi)", Pattern: "*.velfi"},
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
		DefaultFilename: "portfolio.velfi",
		Filters: []runtime.FileFilter{
			{DisplayName: "Velfi Files (*.velfi)", Pattern: "*.velfi"},
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

// FileExists checks if a file or directory exists at the given path
func (a *App) FileExists(path string) (bool, error) {
	_, err := os.Stat(path)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}

// OpenDirectoryDialog shows a native directory picker dialog
func (a *App) OpenDirectoryDialog() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Document Folder",
	})
}

// SelectDocumentDialog shows a native file picker for any document
func (a *App) SelectDocumentDialog() (string, error) {
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Document",
	})
}

// RelativePath computes the relative path from base to target
func (a *App) RelativePath(basePath string, targetPath string) (string, error) {
	return filepath.Rel(basePath, targetPath)
}

// DirOfFile returns the directory portion of a file path
func (a *App) DirOfFile(path string) string {
	return filepath.Dir(path)
}

// CreateDirectory creates a directory and all parent directories
func (a *App) CreateDirectory(path string) error {
	return os.MkdirAll(path, 0755)
}

// SaveCsvDialog shows a native save file dialog for CSV export
func (a *App) SaveCsvDialog(defaultFilename string) (string, error) {
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Export CSV",
		DefaultFilename: defaultFilename,
		Filters: []runtime.FileFilter{
			{DisplayName: "CSV Files (*.csv)", Pattern: "*.csv"},
			{DisplayName: "All Files (*.*)", Pattern: "*.*"},
		},
	})
	if err != nil {
		return "", err
	}
	return path, nil
}

// CopyFile copies a file from src to dst
func (a *App) CopyFile(src string, dst string) error {
	srcFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer srcFile.Close()

	dstFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer dstFile.Close()

	_, err = io.Copy(dstFile, srcFile)
	return err
}
