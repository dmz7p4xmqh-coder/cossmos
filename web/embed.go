// Package web embeds the built frontend bundle so that serve mode ships as a
// single self-contained binary. The dist directory is populated by the Vite
// build; a committed .gitkeep guarantees this package always compiles even
// before the frontend has been built.
package web

import (
	"embed"
	"io/fs"
)

//go:embed all:dist
var distFS embed.FS

// Assets returns the embedded frontend rooted at the dist directory.
func Assets() fs.FS {
	sub, err := fs.Sub(distFS, "dist")
	if err != nil {
		return distFS
	}
	return sub
}
