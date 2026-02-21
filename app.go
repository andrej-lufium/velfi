package main

import (
	"context"
	"encoding/json"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	goruntime "runtime"
	"strings"
	"unicode"

	"github.com/adrg/xdg"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// Version can be set at build time via ldflags: -ldflags "-X main.Version=1.0.0"
var Version = "0.1.0"

// Config holds application configuration settings
type Config struct {
	Locale                string   `json:"locale"`                // UI language (en, de-ch, fr, it)
	Autosave              bool     `json:"autosave"`              // Enable autosave
	DefaultBaseCurrency   string   `json:"defaultBaseCurrency"`   // ISO code (e.g., "CHF")
	DefaultCurrencies     []string `json:"defaultCurrencies"`     // List of ISO codes
	TaxReportHiddenFields []string `json:"taxReportHiddenFields"` // Fields to hide in tax view
}

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

// OpenExternal opens a file or folder in the OS default application
func (a *App) OpenExternal(path string) error {
	switch goruntime.GOOS {
	case "darwin":
		return exec.Command("open", path).Start()
	case "windows":
		return exec.Command("cmd", "/c", "start", "", path).Start()
	default:
		return exec.Command("xdg-open", path).Start()
	}
}

// SanitizeName converts a name to a filesystem-safe folder name
func (a *App) SanitizeName(name string) string {
	s := strings.ToLower(strings.TrimSpace(name))
	var b strings.Builder
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(r)
		} else {
			b.WriteRune('-')
		}
	}
	// Collapse multiple hyphens
	result := b.String()
	for strings.Contains(result, "--") {
		result = strings.ReplaceAll(result, "--", "-")
	}
	return strings.Trim(result, "-")
}

// ChooseDocument opens a file dialog and handles copy-to-docfolder logic.
// Returns the relative path from docfolder (or absolute if outside docroot).
func (a *App) ChooseDocument(docroot string, docfolder string) (string, error) {
	absDocfolder := docfolder
	if absDocfolder != "" && !filepath.IsAbs(absDocfolder) {
		absDocfolder = filepath.Join(docroot, absDocfolder)
	}

	startDir := absDocfolder
	if startDir == "" {
		startDir = docroot
	}

	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title:            "Select Document",
		DefaultDirectory: startDir,
	})
	if err != nil || path == "" {
		return "", err
	}

	// If we have a docfolder, check if file is inside it
	if absDocfolder != "" {
		rel, relErr := filepath.Rel(absDocfolder, path)
		if relErr == nil && !strings.HasPrefix(rel, "..") {
			return rel, nil
		}

		// File is outside docfolder — offer to copy
		confirmed, err := a.ConfirmDialog("Copy Document", "Copy file to asset folder?")
		if err != nil {
			return "", err
		}
		if confirmed {
			if err := os.MkdirAll(absDocfolder, 0755); err != nil {
				return "", err
			}
			basename := filepath.Base(path)
			dst := filepath.Join(absDocfolder, basename)
			if err := a.CopyFile(path, dst); err != nil {
				return "", err
			}
			return basename, nil
		}

		// User declined copy — return relative to docfolder if possible, else absolute
		rel, relErr = filepath.Rel(absDocfolder, path)
		if relErr == nil {
			return rel, nil
		}
		return path, nil
	}

	// No docfolder — return relative to docroot if possible
	if docroot != "" {
		rel, relErr := filepath.Rel(docroot, path)
		if relErr == nil {
			return rel, nil
		}
	}
	return path, nil
}

// ChooseOrCreateFolder handles folder selection/creation for entity docfolders.
// Returns a relative path to docroot.
func (a *App) ChooseOrCreateFolder(docroot string, currentValue string, suggestedName string) (string, error) {
	if currentValue != "" {
		// Already has a folder — let user change it via directory dialog
		startDir := currentValue
		if !filepath.IsAbs(startDir) {
			startDir = filepath.Join(docroot, startDir)
		}
		path, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
			Title:            "Select Document Folder",
			DefaultDirectory: startDir,
		})
		if err != nil || path == "" {
			return currentValue, err
		}
		rel, relErr := filepath.Rel(docroot, path)
		if relErr == nil && !strings.HasPrefix(rel, "..") {
			return rel, nil
		}
		return path, nil
	}

	// No current value — try to create from suggested name
	sanitized := a.SanitizeName(suggestedName)
	if sanitized == "" {
		// No valid name, just open directory dialog
		path, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
			Title:            "Select Document Folder",
			DefaultDirectory: docroot,
		})
		if err != nil || path == "" {
			return "", err
		}
		rel, relErr := filepath.Rel(docroot, path)
		if relErr == nil && !strings.HasPrefix(rel, "..") {
			return rel, nil
		}
		return path, nil
	}

	candidatePath := filepath.Join(docroot, sanitized)
	exists, _ := a.FileExists(candidatePath)
	if exists {
		// Folder already exists — open dialog starting there
		path, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
			Title:            "Select Document Folder",
			DefaultDirectory: candidatePath,
		})
		if err != nil || path == "" {
			return "", err
		}
		rel, relErr := filepath.Rel(docroot, path)
		if relErr == nil && !strings.HasPrefix(rel, "..") {
			return rel, nil
		}
		return path, nil
	}

	// Folder doesn't exist — offer to create it
	confirmed, err := a.ConfirmDialog("Create Folder", "Create folder '"+sanitized+"'?")
	if err != nil {
		return "", err
	}
	if confirmed {
		if err := os.MkdirAll(candidatePath, 0755); err != nil {
			return "", err
		}
		return sanitized, nil
	}

	// User declined — open directory dialog
	path, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title:            "Select Document Folder",
		DefaultDirectory: docroot,
	})
	if err != nil || path == "" {
		return "", err
	}
	rel, relErr := filepath.Rel(docroot, path)
	if relErr == nil && !strings.HasPrefix(rel, "..") {
		return rel, nil
	}
	return path, nil
}

// LoadConfig reads the application config from the XDG config directory
func (a *App) LoadConfig() (*Config, error) {
	configPath, err := xdg.ConfigFile("velfi/config.json")
	if err != nil {
		return nil, err
	}

	// If config file doesn't exist, return defaults
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		return &Config{
			Locale:                "de-ch",
			Autosave:              true,
			DefaultBaseCurrency:   "CHF",
			DefaultCurrencies:     []string{"CHF", "USD", "EUR"},
			TaxReportHiddenFields: []string{"irr", "committed", "totalInvested", "openCommitment", "invested", "divested"},
		}, nil
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, err
	}

	var config Config
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, err
	}

	return &config, nil
}

// SaveConfig writes the application config to the XDG config directory
func (a *App) SaveConfig(config *Config) error {
	configPath, err := xdg.ConfigFile("velfi/config.json")
	if err != nil {
		return err
	}

	// Ensure the directory exists
	if err := os.MkdirAll(filepath.Dir(configPath), 0755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(configPath, data, 0644)
}

// GetConfigPath returns the path to the config file for display purposes
func (a *App) GetConfigPath() (string, error) {
	return xdg.ConfigFile("velfi/config.json")
}
