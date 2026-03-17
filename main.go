package main

import (
	"embed"
	"os"
	"strings"
  "log"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/build
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Check CLI args for a .velfi file (e.g. `velfi myportfolio.velfi`)
	for _, arg := range os.Args[1:] {
		if strings.HasSuffix(arg, ".velfi") {
			app.initialFile = arg
			break
		}
	}
  log.Printf( "starting velfi: %s", app.initialFile)
	appMenu := menu.NewMenu()
	fileMenu := appMenu.AddSubmenu("File")
	fileMenu.AddText("Open...", keys.CmdOrCtrl("o"), func(_ *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:open")
	})
	fileMenu.AddSeparator()
	fileMenu.AddText("Save", keys.CmdOrCtrl("s"), func(_ *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:save")
	})
	fileMenu.AddText("Save As...", keys.Combo("s", keys.CmdOrCtrlKey, keys.ShiftKey), func(_ *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:saveas")
	})
	fileMenu.AddSeparator()
	fileMenu.AddText("Quit", keys.CmdOrCtrl("q"), func(_ *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:quit")
	})

	helpMenu := appMenu.AddSubmenu("Help")
	helpMenu.AddText("About Velfi", nil, func(_ *menu.CallbackData) {
		runtime.EventsEmit(app.ctx, "menu:about")
	})

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "velfi",
		Width:  1024,
		Height: 768,
		Menu:   appMenu,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		DragAndDrop: &options.DragAndDrop{
			EnableFileDrop:     true,
			DisableWebViewDrop: false,
		},
		OnStartup:     app.startup,
		Debug: options.Debug{
        OpenInspectorOnStartup: true,
    },
		/*OnDomReady: func(ctx context.Context) {
			if app.initialFile != "" {
				log.Printf("file:open emit: %#v %s", ctx,app.initialFile)
				runtime.EventsEmit(ctx, "file:open", app.initialFile)
				app.initialFile = ""
			}
		},*/
		OnBeforeClose: app.beforeClose,
		Bind: []interface{}{
			app,
		},
		Mac: &mac.Options{
			OnFileOpen: func(filePath string) {
					app.initialFile = filePath

			},
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

func (b *App) GetInitialFileName() string {
	log.Printf("GetInitialFileName called, initialFile: %s", b.initialFile)
	return b.initialFile
}