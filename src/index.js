/**
 * Playwright 执行引擎主入口文件
 * 将所有组件组合并导出统一的 API
 */

// 导入所有依赖模块
import PlaywrightLogger from './utils/logger.js';
import PlaywrightWaitManager from './dom/wait-manager.js';
import PlaywrightEventSimulator from './dom/event-simulator.js';
import PlaywrightLocatorAdapter from './adapters/locator-adapter.js';
import PlaywrightPageAdapter from './adapters/page-adapter.js';
import PlaywrightExpectAdapter, { createExpect } from './adapters/expect-adapter.js';
import PlaywrightRuntime from './runtime/playwright-runtime.js';
import PlaywrightTestRunner from './runtime/test-runner.js';

// 确保所有依赖都已加载
function ensureDependencies() {
  const dependencies = {
    PlaywrightLogger,
    PlaywrightWaitManager, 
    PlaywrightEventSimulator,
    PlaywrightLocatorAdapter,
    PlaywrightPageAdapter,
    PlaywrightExpectAdapter,
    createExpect,
    PlaywrightRuntime,
    PlaywrightTestRunner
  };
  
  const missing = Object.entries(dependencies)
    .filter(([name, component]) => !component)
    .map(([name]) => name);
  
  if (missing.length > 0) {
    console.warn('缺少依赖:', missing);
  }
}

/**
 * Playwright 执行引擎主类
 */
class PlaywrightExecutionEngine {
  constructor(options = {}) {
    ensureDependencies();
    
    this.options = {
      logLevel: 'info',
      timeout: 30000,
      ...options
    };
    
    // 初始化组件
    this.logger = new PlaywrightLogger(this.options.logLevel);
    this.runtime = new PlaywrightRuntime();
    this.testRunner = new PlaywrightTestRunner(this.options);
    
    this.logger.info('Playwright 执行引擎初始化完成');
  }

  /**
   * 执行脚本字符串
   */
  async runScript(scriptContent, scriptName = 'inline') {
    return await this.testRunner.runScript(scriptContent, scriptName);
  }

  /**
   * 加载并执行脚本文件
   */
  async loadAndRun(scriptPath) {
    return await this.testRunner.loadAndRun(scriptPath);
  }

  /**
   * 批量执行脚本文件
   */
  async runScripts(scriptPaths) {
    return await this.testRunner.runScripts(scriptPaths);
  }

  /**
   * 创建新的 Page 实例
   */
  createPage() {
    return new PlaywrightPageAdapter();
  }

  /**
   * 创建 expect 实例
   */
  expect(target) {
    return createExpect()(target);
  }

  /**
   * 设置全局配置
   */
  configure(config) {
    this.options = { ...this.options, ...config };
    this.testRunner.configure(config);
    return this;
  }

  /**
   * 设置全局钩子
   */
  setHooks(hooks) {
    this.testRunner.setGlobalHooks(hooks);
    return this;
  }

  /**
   * 获取执行统计
   */
  getStats(results) {
    return this.testRunner.getStats(results);
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.testRunner.cleanup();
  }

  /**
   * 获取版本信息
   */
  static getVersion() {
    return typeof __VERSION__ !== 'undefined' ? __VERSION__ : '1.0.0-beta';
  }

  /**
   * 检查浏览器兼容性
   */
  static checkCompatibility() {
    const features = {
      'Promises': typeof Promise !== 'undefined',
      'async/await': (async () => {})().constructor === Promise,
      'Fetch API': typeof fetch !== 'undefined',
      'MutationObserver': typeof MutationObserver !== 'undefined',
      'querySelector': typeof document.querySelector !== 'undefined',
      'addEventListener': typeof document.addEventListener !== 'undefined'
    };
    
    const unsupported = Object.entries(features)
      .filter(([feature, supported]) => !supported)
      .map(([feature]) => feature);
    
    if (unsupported.length > 0) {
      console.warn('浏览器不支持以下功能:', unsupported);
      return false;
    }
    
    return true;
  }
}

// 静态工厂方法
PlaywrightExecutionEngine.create = function(options) {
  if (!PlaywrightExecutionEngine.checkCompatibility()) {
    throw new Error('当前浏览器不支持 Playwright 执行引擎');
  }
  
  return new PlaywrightExecutionEngine(options);
};

// 快捷方法
PlaywrightExecutionEngine.run = async function(script, options = {}) {
  const engine = PlaywrightExecutionEngine.create(options);
  return await engine.runScript(script);
};

PlaywrightExecutionEngine.load = async function(scriptPath, options = {}) {
  const engine = PlaywrightExecutionEngine.create(options);
  return await engine.loadAndRun(scriptPath);
};

// 导出核心组件（供高级用户使用）
PlaywrightExecutionEngine.Components = {
  Logger: PlaywrightLogger,
  WaitManager: PlaywrightWaitManager,
  EventSimulator: PlaywrightEventSimulator,
  PageAdapter: PlaywrightPageAdapter,
  LocatorAdapter: PlaywrightLocatorAdapter,
  ExpectAdapter: PlaywrightExpectAdapter,
  Runtime: PlaywrightRuntime,
  TestRunner: PlaywrightTestRunner
};

// 全局导出（仅在浏览器环境）
if (typeof window !== 'undefined') {
  window.PlaywrightExecutionEngine = PlaywrightExecutionEngine;
  
  // 兼容性别名
  window.PWEngine = PlaywrightExecutionEngine;
  
  // 快捷全局方法
  window.runPlaywrightScript = PlaywrightExecutionEngine.run;
  window.loadPlaywrightScript = PlaywrightExecutionEngine.load;
  
  console.log('🎭 Playwright 执行引擎已加载完成');
  console.log('版本:', PlaywrightExecutionEngine.getVersion());
  console.log('使用方法: new PlaywrightExecutionEngine() 或 PlaywrightExecutionEngine.create()');
}

// ES6 模块默认导出
export default PlaywrightExecutionEngine;

// 命名导出
export {
  PlaywrightLogger,
  PlaywrightWaitManager,
  PlaywrightEventSimulator,
  PlaywrightLocatorAdapter,
  PlaywrightPageAdapter,
  PlaywrightExpectAdapter,
  createExpect,
  PlaywrightRuntime,
  PlaywrightTestRunner
};