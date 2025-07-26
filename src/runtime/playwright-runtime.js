/**
 * Playwright 运行时适配器
 * 模拟 @playwright/test 模块，让 Playwright 脚本能在浏览器中运行
 */
class PlaywrightRuntime {
  constructor() {
    this.logger = new (window.PlaywrightLogger || console)();
    this.setupGlobalEnvironment();
  }

  /**
   * 设置全局环境
   */
  setupGlobalEnvironment() {
    // 模拟 @playwright/test 模块
    window.PlaywrightTest = {
      test: this.createTestFunction(),
      expect: window.PlaywrightExpect || this.createExpectFunction()
    };

    // 设置模块系统
    this.setupModuleSystem();
    
    this.logger.debug('Playwright 运行时环境初始化完成');
  }

  /**
   * 创建 test 函数
   */
  createTestFunction() {
    const self = this;
    
    // 主 test 函数
    function test(name, testFn) {
      return {
        name,
        fn: testFn,
        run: async () => {
          const page = new (window.PlaywrightPageAdapter || PageAdapter)();
          const context = { page };
          
          try {
            self.logger.info(`🧪 开始测试: ${name}`);
            const startTime = Date.now();
            
            await testFn(context);
            
            const duration = Date.now() - startTime;
            self.logger.success(`✅ 测试通过: ${name} (${duration}ms)`);
            return { success: true, duration, name };
          } catch (error) {
            const duration = Date.now() - startTime;
            self.logger.error(`❌ 测试失败: ${name} (${duration}ms)`, error);
            return { success: false, error, duration, name };
          }
        }
      };
    }

    // 添加 test 的静态方法
    test.skip = (name, testFn) => {
      self.logger.warn(`⏭️ 跳过测试: ${name}`);
      return {
        name,
        fn: testFn,
        skipped: true,
        run: async () => ({ success: true, skipped: true, name })
      };
    };

    test.only = (name, testFn) => {
      const testCase = test(name, testFn);
      testCase.only = true;
      return testCase;
    };

    test.describe = (name, suiteFn) => {
      self.logger.info(`📁 测试套件: ${name}`);
      return suiteFn();
    };

    test.beforeEach = (hookFn) => {
      // 简单实现，存储钩子函数
      test._beforeEachHooks = test._beforeEachHooks || [];
      test._beforeEachHooks.push(hookFn);
    };

    test.afterEach = (hookFn) => {
      test._afterEachHooks = test._afterEachHooks || [];
      test._afterEachHooks.push(hookFn);
    };

    test.beforeAll = (hookFn) => {
      test._beforeAllHooks = test._beforeAllHooks || [];
      test._beforeAllHooks.push(hookFn);
    };

    test.afterAll = (hookFn) => {
      test._afterAllHooks = test._afterAllHooks || [];
      test._afterAllHooks.push(hookFn);
    };

    return test;
  }

  /**
   * 创建 expect 函数
   */
  createExpectFunction() {
    return function expect(target) {
      return new (window.PlaywrightExpectAdapter || ExpectAdapter)(target);
    };
  }

  /**
   * 设置模块系统
   */
  setupModuleSystem() {
    // 拦截 ES6 import
    if (typeof window.importShim === 'undefined') {
      window.importShim = {
        '@playwright/test': window.PlaywrightTest
      };
    }
  }

  /**
   * 直接执行 Playwright 脚本
   */
  async executeScript(scriptContent) {
    try {
      // 转换 import 语句
      const transformedScript = this.transformImports(scriptContent);
      
      // 在沙箱环境中执行
      const testCases = await this.runInSandbox(transformedScript);
      
      // 执行所有测试
      const results = await this.runTests(testCases);
      
      return results;
    } catch (error) {
      this.logger.error('脚本执行失败:', error);
      throw error;
    }
  }

  /**
   * 转换 import 语句
   */
  transformImports(scriptContent) {
    // 简单的字符串替换，将 import 转换为我们的运行时
    let transformed = scriptContent;
    
    // 匹配各种 import 形式
    const importPatterns = [
      // import { test, expect } from '@playwright/test';
      /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@playwright\/test['"];?/g,
      // import { expect, test } from '@playwright/test';
      /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@playwright\/test['"];?/g,
      // import * as pw from '@playwright/test';
      /import\s*\*\s*as\s+(\w+)\s*from\s*['"]@playwright\/test['"];?/g
    ];
    
    // 替换标准导入
    transformed = transformed.replace(importPatterns[0], (match, imports) => {
      const importItems = imports.split(',').map(item => item.trim());
      const declarations = importItems.map(item => {
        const cleanItem = item.replace(/\s+as\s+\w+/, ''); // 移除 as 别名
        return `${item} = window.PlaywrightTest.${cleanItem}`;
      }).join(', ');
      
      return `const { ${declarations} } = window.PlaywrightTest;`;
    });
    
    // 替换命名空间导入
    transformed = transformed.replace(importPatterns[2], (match, namespace) => {
      return `const ${namespace} = window.PlaywrightTest;`;
    });
    
    // 简单替换（兜底）
    transformed = transformed
      .replace(/import\s*{\s*test,?\s*expect\s*}\s*from\s*['"]@playwright\/test['"];?/g, 
               'const { test, expect } = window.PlaywrightTest;')
      .replace(/import\s*{\s*expect,?\s*test\s*}\s*from\s*['"]@playwright\/test['"];?/g, 
               'const { test, expect } = window.PlaywrightTest;');
    
    this.logger.debug('Import 语句转换完成');
    return transformed;
  }

  /**
   * 在沙箱环境中执行脚本
   */
  async runInSandbox(scriptContent) {
    const testCases = [];
    
    // 重写 test 函数来收集测试用例
    const originalTest = window.PlaywrightTest.test;
    const self = this;
    
    window.PlaywrightTest.test = function(name, fn) {
      const testCase = originalTest(name, fn);
      testCases.push(testCase);
      self.logger.debug(`收集测试用例: ${name}`);
      return testCase;
    };
    
    // 保持原有的静态方法
    Object.keys(originalTest).forEach(key => {
      if (typeof originalTest[key] === 'function') {
        window.PlaywrightTest.test[key] = originalTest[key];
      }
    });

    try {
      // 执行脚本
      const scriptFunction = new Function(scriptContent);
      scriptFunction();
      
      this.logger.info(`收集到 ${testCases.length} 个测试用例`);
    } catch (error) {
      this.logger.error('脚本执行出错:', error);
      throw error;
    } finally {
      // 恢复原始 test 函数
      window.PlaywrightTest.test = originalTest;
    }

    return testCases;
  }

  /**
   * 运行测试
   */
  async runTests(testCases) {
    const results = [];
    const onlyTests = testCases.filter(test => test.only);
    const testsToRun = onlyTests.length > 0 ? onlyTests : testCases.filter(test => !test.skipped);
    
    this.logger.info(`开始执行 ${testsToRun.length} 个测试`);
    
    // 执行 beforeAll 钩子
    await this.runHooks('_beforeAllHooks');
    
    for (const testCase of testsToRun) {
      try {
        // 执行 beforeEach 钩子
        await this.runHooks('_beforeEachHooks', testCase);
        
        // 执行测试
        const result = await testCase.run();
        results.push(result);
        
        // 执行 afterEach 钩子
        await this.runHooks('_afterEachHooks', testCase);
        
      } catch (error) {
        this.logger.error(`测试执行异常: ${testCase.name}`, error);
        results.push({ 
          success: false, 
          error, 
          name: testCase.name,
          duration: 0 
        });
      }
    }
    
    // 执行 afterAll 钩子
    await this.runHooks('_afterAllHooks');
    
    // 输出测试总结
    this.printTestSummary(results);
    
    return results;
  }

  /**
   * 运行钩子函数
   */
  async runHooks(hookType, testCase = null) {
    const test = window.PlaywrightTest.test;
    const hooks = test[hookType] || [];
    
    for (const hook of hooks) {
      try {
        if (testCase) {
          const page = new (window.PlaywrightPageAdapter || PageAdapter)();
          await hook({ page });
        } else {
          await hook();
        }
      } catch (error) {
        this.logger.error(`钩子函数执行失败 (${hookType}):`, error);
      }
    }
  }

  /**
   * 打印测试总结
   */
  printTestSummary(results) {
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const skipped = results.filter(r => r.skipped).length;
    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    this.logger.info(`
📊 测试总结:
   ✅ 通过: ${passed}
   ❌ 失败: ${failed}
   ⏭️ 跳过: ${skipped}
   ⏱️ 总耗时: ${totalDuration}ms
    `);
    
    if (failed > 0) {
      this.logger.error('失败的测试:');
      results.filter(r => !r.success).forEach(r => {
        this.logger.error(`  - ${r.name}: ${r.error?.message}`);
      });
    }
  }
}

// 导出给浏览器使用
if (typeof window !== 'undefined') {
  window.PlaywrightRuntime = PlaywrightRuntime;
}

// Node.js 环境
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlaywrightRuntime;
}

// ES6 模块导出
export default PlaywrightRuntime;