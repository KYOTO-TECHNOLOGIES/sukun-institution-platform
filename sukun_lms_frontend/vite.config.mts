import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from "vite-plugin-svgr";
import checker from 'vite-plugin-checker';
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
      tsconfigPaths(),
        svgr({
        svgrOptions: {
          // svgr options (optional)
        },
      }),
      checker({
        typescript: {
          tsconfigPath: './tsconfig.json',
        },
        // eslint: {
        //   lintCommand: "eslint --ext .js,.jsx,.ts,.tsx src", // ESLint for `.js`, `.jsx`, `.ts`, `.tsx`
        // },
      })
  ],
   base: process.env.PUBLIC_URL || "/",
    resolve: {
      alias: {
        "~bootstrap": path.resolve(__dirname, "node_modules/bootstrap"),
      },
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react/jsx-dev-runtime",
        "react/jsx-runtime",
        "@tanstack/react-query",
        "@mui/material",
        "@mui/icons-material",
        "@mui/lab",
        "qrcode",
      ],
      exclude: ["react-qr-code"],
      esbuildOptions: {
        target: "esnext",
      },
    },
    server: {
      allowedHosts:['.trycloudflare.com'],
      fs: {
        strict: true,
      },
      proxy: {
        '/ws': { target: 'ws://127.0.0.1:8000', ws: true },
        '/static': { target: 'http://127.0.0.1:8000', changeOrigin: true },
        '/media': { target: 'http://127.0.0.1:8000', changeOrigin: true },
        '/health': { target: 'http://127.0.0.1:8000', changeOrigin: true },
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
    build: {
    outDir: 'build', 
		rollupOptions: {
      
		  output: {
			manualChunks: {
			  reactVendor: ["react", "react-dom"], // Separate React
			},
		  },
		},
	},
  define: {
    global: 'window' // Polyfill global for browser use
  }

})



