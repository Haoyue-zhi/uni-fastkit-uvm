import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // 声明为库模式打包
    lib: {
      entry: './bin/index.ts', // 入口文件
      formats: ['es'], // 输出格式：Node库优先用ESM（mjs）
      fileName: 'index' // 输出文件名
    },
    // 传递给Rollup的配置（Vite基于Rollup打包）
    rollupOptions: {
      // 排除Node内置模块和第三方依赖（不打包进最终产物）
      external: ['node:child_process'], // 必须排除Node内置模块（如fs、path等）
    }
  }
});
