/**
 * Page 适配器 - 实现 Playwright Page API
 */
class PageAdapter {
  constructor() {
    this.logger = new (window.PlaywrightLogger || console)();
    this.waitManager = new (window.PlaywrightWaitManager || WaitManager)();
    this.eventSimulator = new (window.PlaywrightEventSimulator || EventSimulator)();
  }

  // =============== 导航方法 ===============

  /**
   * 导航到指定 URL
   */
  async goto(url, options = {}) {
    const { waitUntil = 'load', timeout = 30000 } = options;
    
    this.logger.info(`导航到: ${url}`);
    
    if (window.location.href !== url) {
      window.location.href = url;
      await this.waitForLoadState(waitUntil, timeout);
    }
    
    return { url: window.location.href, status: 200 };
  }

  /**
   * 后退
   */
  async goBack(options = {}) {
    const { waitUntil = 'load' } = options;
    window.history.back();
    await this.waitForLoadState(waitUntil);
  }

  /**
   * 前进
   */
  async goForward(options = {}) {
    const { waitUntil = 'load' } = options;
    window.history.forward();
    await this.waitForLoadState(waitUntil);
  }

  /**
   * 刷新页面
   */
  async reload(options = {}) {
    const { waitUntil = 'load' } = options;
    window.location.reload();
    await this.waitForLoadState(waitUntil);
  }

  // =============== 页面信息获取 ===============

  /**
   * 获取当前 URL
   */
  url() {
    return window.location.href;
  }

  /**
   * 获取页面标题
   */
  async title() {
    return document.title;
  }

  /**
   * 获取页面内容
   */
  async content() {
    return document.documentElement.outerHTML;
  }

  // =============== 元素交互方法 ===============

  /**
   * 点击元素
   */
  async click(selector, options = {}) {
    const element = await this.waitForSelector(selector);
    await this.scrollIntoViewIfNeeded(element);
    
    this.eventSimulator.simulateClick(element, options);
    this.logger.debug(`点击: ${selector}`);
  }

  /**
   * 双击元素
   */
  async dblclick(selector, options = {}) {
    const element = await this.waitForSelector(selector);
    await this.scrollIntoViewIfNeeded(element);
    
    this.eventSimulator.simulateDoubleClick(element);
    this.logger.debug(`双击: ${selector}`);
  }

  /**
   * 填充表单
   */
  async fill(selector, value, options = {}) {
    const element = await this.waitForSelector(selector);
    await this.scrollIntoViewIfNeeded(element);
    
    // 清空并填充
    element.value = '';
    element.value = value;
    
    // 触发相关事件
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    this.logger.debug(`填充: ${selector} = "${value}"`);
  }

  /**
   * 按键操作
   */
  async press(selector, key, options = {}) {
    const element = await this.waitForSelector(selector);
    element.focus();
    
    this.eventSimulator.simulateKeyPress(element, key, options);
    this.logger.debug(`按键: ${selector} -> ${key}`);
  }

  /**
   * 输入文本（模拟打字）
   */
  async type(selector, text, options = {}) {
    const element = await this.waitForSelector(selector);
    await this.eventSimulator.simulateTyping(element, text, options);
    this.logger.debug(`输入: ${selector} -> "${text}"`);
  }

  /**
   * 悬停
   */
  async hover(selector) {
    const element = await this.waitForSelector(selector);
    await this.scrollIntoViewIfNeeded(element);
    
    this.eventSimulator.simulateHover(element);
    this.logger.debug(`悬停: ${selector}`);
  }

  /**
   * 选择复选框
   */
  async check(selector) {
    const element = await this.waitForSelector(selector);
    if (element.type === 'checkbox' || element.type === 'radio') {
      element.checked = true;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      this.logger.debug(`选择: ${selector}`);
    }
  }

  /**
   * 取消选择复选框
   */
  async uncheck(selector) {
    const element = await this.waitForSelector(selector);
    if (element.type === 'checkbox') {
      element.checked = false;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      this.logger.debug(`取消选择: ${selector}`);
    }
  }

  /**
   * 选择下拉选项
   */
  async selectOption(selector, values, options = {}) {
    const element = await this.waitForSelector(selector);
    if (element.tagName === 'SELECT') {
      if (Array.isArray(values)) {
        // 多选
        Array.from(element.options).forEach(option => {
          option.selected = values.includes(option.value) || values.includes(option.text);
        });
      } else {
        element.value = values;
      }
      element.dispatchEvent(new Event('change', { bubbles: true }));
      this.logger.debug(`选择选项: ${selector} = ${values}`);
    }
  }

  // =============== 现代定位器方法 ===============

  /**
   * 创建 Locator
   */
  locator(selector, options = {}) {
    return new (window.PlaywrightLocatorAdapter || LocatorAdapter)(selector, this, options);
  }

  /**
   * 根据角色定位
   */
  getByRole(role, options = {}) {
    const { name, exact = false, level } = options;
    let selector = `[role="${role}"]`;
    
    if (name) {
      if (exact) {
        selector += `[aria-label="${name}"], [role="${role}"][aria-labelledby] *:contains("${name}")`;
      } else {
        selector += `[aria-label*="${name}"], [role="${role}"][aria-labelledby] *:contains("${name}")`;
      }
    }
    
    if (level && role === 'heading') {
      selector = `h${level}[role="heading"], h${level}`;
    }
    
    return this.locator(selector);
  }

  /**
   * 根据文本定位
   */
  getByText(text, options = {}) {
    const { exact = false } = options;
    let xpath;
    
    if (exact) {
      xpath = `//*[normalize-space(text())="${text}"]`;
    } else {
      xpath = `//*[contains(normalize-space(text()), "${text}")]`;
    }
    
    return this.locator(`xpath=${xpath}`);
  }

  /**
   * 根据标签定位
   */
  getByLabel(text, options = {}) {
    const { exact = false } = options;
    
    // 查找 label 关联的 input
    const labelSelector = exact 
      ? `label:contains("${text}")` 
      : `label:contains("${text}")`;
    
    // 通过 for 属性或包含关系查找
    const selector = `${labelSelector} input, input[id]:has(+ label:contains("${text}")), input[aria-labelledby]:has(~ *:contains("${text}"))`;
    
    return this.locator(selector);
  }

  /**
   * 根据占位符定位
   */
  getByPlaceholder(text, options = {}) {
    const { exact = false } = options;
    const selector = exact 
      ? `[placeholder="${text}"]`
      : `[placeholder*="${text}"]`;
    
    return this.locator(selector);
  }

  /**
   * 根据测试 ID 定位
   */
  getByTestId(testId) {
    return this.locator(`[data-testid="${testId}"]`);
  }

  /**
   * 根据标题定位
   */
  getByTitle(text, options = {}) {
    const { exact = false } = options;
    const selector = exact 
      ? `[title="${text}"]`
      : `[title*="${text}"]`;
    
    return this.locator(selector);
  }

  // =============== 等待方法 ===============

  /**
   * 等待元素
   */
  async waitForSelector(selector, options = {}) {
    const { timeout = 30000, state = 'visible' } = options;
    
    // 如果是 xpath，需要特殊处理
    if (selector.startsWith('xpath=')) {
      return this.waitForXPath(selector.substring(6), { timeout, state });
    }
    
    const element = await this.waitManager.waitForElement(selector, timeout);
    
    if (state === 'visible') {
      await this.waitManager.waitForCondition(
        () => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && 
                 style.visibility !== 'hidden' && style.display !== 'none';
        },
        timeout,
        `元素 "${selector}" 等待可见超时`
      );
    }
    
    return element;
  }

  /**
   * 等待 XPath 元素
   */
  async waitForXPath(xpath, options = {}) {
    const { timeout = 30000 } = options;
    
    return this.waitManager.waitForCondition(
      () => {
        const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        return result.singleNodeValue;
      },
      timeout,
      `XPath 元素等待超时: ${xpath}`
    );
  }

  /**
   * 等待超时
   */
  async waitForTimeout(ms) {
    return this.waitManager.waitForTimeout(ms);
  }

  /**
   * 等待函数
   */
  async waitForFunction(fn, arg, options = {}) {
    const { timeout = 30000 } = options;
    return this.waitManager.waitForCondition(
      () => fn(arg),
      timeout,
      '等待函数条件超时'
    );
  }

  /**
   * 等待 URL
   */
  async waitForURL(url, options = {}) {
    const { timeout = 30000 } = options;
    return this.waitManager.waitForURL(url, timeout);
  }

  /**
   * 等待加载状态
   */
  async waitForLoadState(state = 'load', timeout = 30000) {
    return this.waitManager.waitForLoadState(state);
  }

  // =============== 脚本执行方法 ===============

  /**
   * 在页面上下文中执行脚本
   */
  async evaluate(fn, ...args) {
    try {
      return fn.apply(window, args);
    } catch (error) {
      this.logger.error('脚本执行失败:', error);
      throw error;
    }
  }

  /**
   * 在页面上下文中执行脚本并返回句柄
   */
  async evaluateHandle(fn, ...args) {
    return this.evaluate(fn, ...args);
  }

  /**
   * 添加脚本标签
   */
  async addScriptTag(options = {}) {
    const { url, path, content, type = 'text/javascript' } = options;
    
    const script = document.createElement('script');
    script.type = type;
    
    if (url) {
      script.src = url;
    } else if (content) {
      script.textContent = content;
    }
    
    document.head.appendChild(script);
    
    // 等待脚本加载
    if (url) {
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
      });
    }
    
    this.logger.debug('添加脚本标签');
    return script;
  }

  /**
   * 添加样式标签
   */
  async addStyleTag(options = {}) {
    const { url, path, content } = options;
    
    if (url) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
      return link;
    } else if (content) {
      const style = document.createElement('style');
      style.textContent = content;
      document.head.appendChild(style);
      return style;
    }
  }

  // =============== 辅助方法 ===============

  /**
   * 滚动元素到可视区域
   */
  async scrollIntoViewIfNeeded(element) {
    const rect = element.getBoundingClientRect();
    const isInViewport = rect.top >= 0 && rect.bottom <= window.innerHeight &&
                        rect.left >= 0 && rect.right <= window.innerWidth;
    
    if (!isInViewport) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.waitForTimeout(100); // 等待滚动完成
      this.logger.debug('元素滚动到可视区域');
    }
  }

  /**
   * 获取元素边界框
   */
  async boundingBox(selector) {
    const element = await this.waitForSelector(selector);
    const rect = element.getBoundingClientRect();
    
    return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height
    };
  }

  /**
   * 设置视口大小（有限支持）
   */
  async setViewportSize(size) {
    // 浏览器环境中无法直接设置视口大小
    // 这里只是记录日志
    this.logger.warn('浏览器环境中无法设置视口大小');
    return { width: window.innerWidth, height: window.innerHeight };
  }

  /**
   * 获取视口大小
   */
  viewportSize() {
    return { width: window.innerWidth, height: window.innerHeight };
  }
}

// 导出给浏览器使用
if (typeof window !== 'undefined') {
  window.PlaywrightPageAdapter = PageAdapter;
}

// Node.js 环境
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PageAdapter;
}

// ES6 模块导出
export default PageAdapter;