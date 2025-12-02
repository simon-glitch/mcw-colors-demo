import { defineConfig } from 'vite'
import { promises as fsp } from 'fs'
import path from 'path'

export default defineConfig({
	root: 'src',
	server: {
		open: false,
	},
	build: {
		outDir: 'compiled',
		emptyOutDir: true,
	},
	plugins: [
		{
			name: 'serve-root-index',
			configureServer(server) {
				server.middlewares.use(async (req, res, next) => {
					try {
						if (req.url === '/' || req.url === '/index.html') {
							const filePath = path.resolve(process.cwd(), 'src', 'index.html')
							let html = await fsp.readFile(filePath, 'utf-8')
							html = await server.transformIndexHtml(req.url, html)
							res.statusCode = 200
							res.setHeader('Content-Type', 'text/html')
							res.end(html)
							return
						}
					} catch (e) {
						// fall through to next middleware on error
					}
					next()
				})
			},
		},
	],
})
