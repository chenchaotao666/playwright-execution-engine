/**
 * 等待管理器 - 处理各种等待机制
 */
class WaitManager {
  constructor() {
    this.defaultTimeout = 30000;
    this.logger = new (window.PlaywrightLogger || console)();
  }

  /**
   * 等待元素出现
   */
  async waitForElement(selector, timeout = this.defaultTimeout) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // 立即检查
      const existing = document.querySelector(selector);
      if (existing) {
        this.logger.debug(`元素立即找到: ${selector}`);
        return resolve(existing);
      }

      let timeoutId;
      let observer;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (observer) observer.disconnect();
      };

      // 设置超时
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`等待元素超时: ${selector} (${timeout}ms)`));
      }, timeout);

      // 监听 DOM 变化
      observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          cleanup();
          const elapsed = Date.now() - startTime;
          this.logger.debug(`元素找到: ${selector} (${elapsed}ms)`);
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });
    });
  }

  /**
   * 等待条件满足
   */
  async waitForCondition(conditionFn, timeout = this.defaultTimeout, errorMessage = '等待条件超时') {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = async () => {
        try {
          const result = await conditionFn();
          if (result) {
            const elapsed = Date.now() - startTime;
            this.logger.debug(`条件满足 (${elapsed}ms)`);
            resolve(result);
            return;
          }
        } catch (error) {
          // 继续等待，忽略错误
          this.logger.debug('条件检查出错，继续等待:', error.message);
        }

        if (Date.now() - startTime >= timeout) {
          reject(new Error(`${errorMessage} (${timeout}ms)`));
          return;
        }

        setTimeout(check, 100);
      };

      check();
    });
  }

  /**
   * 等待函数返回真值
   */
  async waitForFunction(fn, timeout = this.defaultTimeout) {
    return this.waitForCondition(fn, timeout, '等待函数条件超时');
  }

  /**
   * 等待 URL 变化
   */
  async waitForURL(urlPattern, timeout = this.defaultTimeout) {
    return this.waitForCondition(
      () => {
        const currentUrl = window.location.href;
        if (typeof urlPattern === 'string') {
          return currentUrl.includes(urlPattern);
        }
        if (urlPattern instanceof RegExp) {
          return urlPattern.test(currentUrl);
        }
        return false;
      },
      timeout,
      `等待URL变化超时: ${urlPattern}`
    );
  }

  /**
   * 等待页面加载状态
   */
  async waitForLoadState(state = 'load') {
    return new Promise((resolve) => {
      const checkState = () => {
        if (state === 'load' && document.readyState === 'complete') {
          this.logger.debug('页面完全加载');
          resolve();
        } else if (state === 'domcontentloaded' && document.readyState !== 'loading') {
          this.logger.debug('DOM 内容加载完成');
          resolve();
        } else if (state === 'networkidle') {
          // 简单实现：等待 500ms 无网络请求
          setTimeout(() => {
            this.logger.debug('网络空闲');
            resolve();
          }, 500);
        }
      };

      if (document.readyState === 'complete' && state === 'load') {
        resolve();
      } else if (document.readyState !== 'loading' && state === 'domcontentloaded') {
        resolve();
      } else {
        document.addEventListener('readystatechange', checkState, { once: true });
      }
    });
  }

  /**
   * 简单延时
   */
  async waitForTimeout(ms) {
    this.logger.debug(`等待 ${ms}ms`);
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出给浏览器使用
if (typeof window !== 'undefined') {
  window.PlaywrightWaitManager = WaitManager;
}

// Node.js 环境
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WaitManager;
}

// ES6 模块导出
export default WaitManager;