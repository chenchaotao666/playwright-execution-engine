import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    // 构建库模式
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'PlaywrightExecutionEngine',
      fileName: (format) => `playwright-execution-engine.${format}.js`,
      formats: ['umd', 'es', 'iife']
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: [],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {},
        // 修复命名导出和默认导出混合的警告
        exports: 'named',
        // 为 IIFE 格式添加全局变量
        ...(process.env.FORMAT === 'iife' && {
          name: 'PlaywrightExecutionEngine',
          extend: true
        })
      }
    },
    // 生成 source map
    sourcemap: true,
    // 设置构建目标
    target: 'es2015',
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      },
      format: {
        comments: false
      }
    }
  },
  
  // 开发服务器配置
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  
  // 预览服务器配置
  preview: {
    port: 3001
  },
  
  // 定义全局常量
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0-beta'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // 插件配置
  plugins: [
    // 自定义插件：生成演示页面
    {
      name: 'copy-examples',
      generateBundle() {
        // 在构建完成后，我们可以在这里处理示例文件
      }
    }
  ],
  
  // 解析配置
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@adapters': resolve(__dirname, 'src/adapters'),
      '@dom': resolve(__dirname, 'src/dom'),
      '@runtime': resolve(__dirname, 'src/runtime')
    }
  },
  
  // 优化配置
  optimizeDeps: {
    exclude: [] // 排除预构建的依赖
  }
});