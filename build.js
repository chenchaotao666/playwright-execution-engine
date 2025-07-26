/**
 * 构建脚本 - 将所有源文件合并为单个文件
 */
const fs = require('fs');
const path = require('path');

// 源文件顺序（依赖关系）
const sourceFiles = [
  'src/utils/logger.js',
  'src/dom/wait-manager.js', 
  'src/dom/event-simulator.js',
  'src/adapters/locator-adapter.js',
  'src/adapters/page-adapter.js',
  'src/adapters/expect-adapter.js',
  'src/runtime/playwright-runtime.js',
  'src/runtime/test-runner.js',
  'src/index.js'
];

function buildBundle() {
  console.log('🔨 开始构建 Playwright 执行引擎...');
  
  let bundleContent = '';
  
  // 添加文件头注释
  bundleContent += `/**
 * Playwright 执行引擎 - 浏览器版本
 * 版本: 1.0.0-beta
 * 构建时间: ${new Date().toISOString()}
 * 
 * 这个文件包含了完整的 Playwright 执行引擎，可以在浏览器中直接运行 Playwright 脚本
 */

(function() {
  'use strict';
  
`;

  // 合并所有源文件
  sourceFiles.forEach(filePath => {
    console.log(`📄 处理文件: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ 文件不存在: ${filePath}`);
      process.exit(1);
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 移除文件中的导出语句和模块检查
    const cleanContent = content
      .replace(/\/\/ 导出给浏览器使用[\s\S]*?\/\/ Node\.js 环境[\s\S]*?}/g, '')
      .replace(/if \(typeof window !== 'undefined'\) \{[\s\S]*?\}/g, '')
      .replace(/if \(typeof module !== 'undefined' && module\.exports\) \{[\s\S]*?\}/g, '')
      .replace(/module\.exports = [\w\W]*?;/g, '')
      .replace(/window\.Playwright\w+ = \w+;/g, '');
    
    bundleContent += `\n// =============== ${path.basename(filePath)} ===============\n`;
    bundleContent += cleanContent;
    bundleContent += '\n';
  });

  // 添加文件尾
  bundleContent += `
})();

// 兼容性检查
if (!PlaywrightExecutionEngine.checkCompatibility()) {
  console.error('❌ 当前浏览器不支持 Playwright 执行引擎');
}
`;

  // 确保 dist 目录存在
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }

  // 写入构建文件
  const outputPath = 'dist/playwright-execution-engine.js';
  fs.writeFileSync(outputPath, bundleContent);
  
  console.log(`✅ 构建完成: ${outputPath}`);
  console.log(`📦 文件大小: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);

  // 创建压缩版本（简单的压缩）
  const minifiedContent = bundleContent
    .replace(/\/\*[\s\S]*?\*\//g, '') // 移除多行注释
    .replace(/\/\/.*$/gm, '') // 移除单行注释
    .replace(/\s+/g, ' ') // 压缩空白字符
    .trim();
  
  const minOutputPath = 'dist/playwright-execution-engine.min.js';
  fs.writeFileSync(minOutputPath, minifiedContent);
  
  console.log(`🗜️ 压缩版本: ${minOutputPath}`);
  console.log(`📦 压缩大小: ${(fs.statSync(minOutputPath).size / 1024).toFixed(2)} KB`);
}

// 如果直接运行这个脚本
if (require.main === module) {
  buildBundle();
}

module.exports = { buildBundle };