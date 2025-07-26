/**
 * Locator 适配器 - 实现 Playwright Locator API
 */
class LocatorAdapter {
  constructor(selector, page, options = {}) {
    this.selector = selector;
    this.page = page;
    this.options = options;
    this.filters = [];
    this.logger = new (window.PlaywrightLogger || console)();
    this.waitManager = page.waitManager;
    this.eventSimulator = page.eventSimulator;
  }

  // =============== 链式过滤器方法 ===============

  /**
   * 过滤 locator
   */
  filter(options) {
    const newLocator = new LocatorAdapter(this.selector, this.page);
    newLocator.filters = [...this.filters, options];
    return newLocator;
  }

  /**
   * 获取第一个元素
   */
  first() {
    return this.nth(0);
  }

  /**
   * 获取最后一个元素
   */
  last() {
    return this.filter({ position: 'last' });
  }

  /**
   * 获取第 n 个元素
   */
  nth(n) {
    return this.filter({ position: n });
  }

  /**
   * 根据文本过滤
   */
  getByText(text, options = {}) {
    return this.filter({ hasText: text, exact: options.exact });
  }

  // =============== 核心操作方法 ===============

  /**
   * 点击元素
   */
  async click(options = {}) {
    const element = await this.getElement();
    await this.page.scrollIntoViewIfNeeded(element);
    
    this.eventSimulator.simulateClick(element, options);
    this.logger.debug(`点击元素: ${this.selector}`);
  }

  /**
   * 双击元素
   */
  async dblclick(options = {}) {
    const element = await this.getElement();
    await this.page.scrollIntoViewIfNeeded(element);
    
    this.eventSimulator.simulateDoubleClick(element);
    this.logger.debug(`双击元素: ${this.selector}`);
  }

  /**
   * 填充表单
   */
  async fill(value, options = {}) {
    const element = await this.getElement();
    await this.page.scrollIntoViewIfNeeded(element);
    
    // 清空并填充
    element.value = '';
    element.value = value;
    
    // 触发相关事件
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    this.logger.debug(`填充元素: ${this.selector} = "${value}"`);
  }

  /**
   * 按键操作
   */
  async press(key, options = {}) {
    const element = await this.getElement();
    element.focus();
    
    this.eventSimulator.simulateKeyPress(element, key, options);
    this.logger.debug(`按键: ${this.selector} -> ${key}`);
  }

  /**
   * 逐字符输入（模拟打字）
   */
  async pressSequentially(text, options = {}) {
    const element = await this.getElement();
    await this.eventSimulator.simulateTyping(element, text, options);
    this.logger.debug(`逐字符输入: ${this.selector} -> "${text}"`);
  }

  /**
   * 悬停
   */
  async hover() {
    const element = await this.getElement();
    await this.page.scrollIntoViewIfNeeded(element);
    
    this.eventSimulator.simulateHover(element);
    this.logger.debug(`悬停元素: ${this.selector}`);
  }

  /**
   * 选择复选框
   */
  async check() {
    const element = await this.getElement();
    if (element.type === 'checkbox' || element.type === 'radio') {
      element.checked = true;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      this.logger.debug(`选择复选框: ${this.selector}`);
    }
  }

  /**
   * 取消选择复选框
   */
  async uncheck() {
    const element = await this.getElement();
    if (element.type === 'checkbox') {
      element.checked = false;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      this.logger.debug(`取消选择复选框: ${this.selector}`);
    }
  }

  /**
   * 选择下拉选项
   */
  async selectOption(values, options = {}) {
    const element = await this.getElement();
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
      this.logger.debug(`选择下拉选项: ${this.selector} = ${values}`);
    }
  }

  // =============== 状态检查方法 ===============

  /**
   * 检查元素是否可见
   */
  async isVisible() {
    try {
      const element = await this.getElement();
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      
      return rect.width > 0 && 
             rect.height > 0 && 
             style.visibility !== 'hidden' && 
             style.display !== 'none' &&
             element.offsetParent !== null;
    } catch {
      return false;
    }
  }

  /**
   * 检查元素是否隐藏
   */
  async isHidden() {
    return !(await this.isVisible());
  }

  /**
   * 检查元素是否启用
   */
  async isEnabled() {
    try {
      const element = await this.getElement();
      return !element.disabled && !element.hasAttribute('disabled');
    } catch {
      return false;
    }
  }

  /**
   * 检查元素是否禁用
   */
  async isDisabled() {
    return !(await this.isEnabled());
  }

  /**
   * 检查复选框是否选中
   */
  async isChecked() {
    try {
      const element = await this.getElement();
      return element.checked || false;
    } catch {
      return false;
    }
  }

  // =============== 内容获取方法 ===============

  /**
   * 获取文本内容
   */
  async textContent() {
    const element = await this.getElement();
    return element.textContent || '';
  }

  /**
   * 获取内部文本
   */
  async innerText() {
    const element = await this.getElement();
    return element.innerText || '';
  }

  /**
   * 获取 HTML 内容
   */
  async innerHTML() {
    const element = await this.getElement();
    return element.innerHTML || '';
  }

  /**
   * 获取属性值
   */
  async getAttribute(name) {
    const element = await this.getElement();
    return element.getAttribute(name);
  }

  /**
   * 获取输入值
   */
  async inputValue() {
    const element = await this.getElement();
    return element.value || '';
  }

  // =============== 等待方法 ===============

  /**
   * 等待元素状态
   */
  async waitFor(options = {}) {
    const { state = 'visible', timeout = 30000 } = options;
    
    switch (state) {
      case 'visible':
        return this.waitForVisible(timeout);
      case 'hidden':
        return this.waitForHidden(timeout);
      case 'attached':
        return this.waitForAttached(timeout);
      case 'detached':
        return this.waitForDetached(timeout);
      default:
        throw new Error(`未知的等待状态: ${state}`);
    }
  }

  async waitForVisible(timeout) {
    return this.waitManager.waitForCondition(
      () => this.isVisible(),
      timeout,
      `元素 "${this.selector}" 等待可见超时`
    );
  }

  async waitForHidden(timeout) {
    return this.waitManager.waitForCondition(
      () => this.isHidden(),
      timeout,
      `元素 "${this.selector}" 等待隐藏超时`
    );
  }

  async waitForAttached(timeout) {
    return this.waitManager.waitForCondition(
      () => this.count() > 0,
      timeout,
      `元素 "${this.selector}" 等待附加到DOM超时`
    );
  }

  async waitForDetached(timeout) {
    return this.waitManager.waitForCondition(
      () => this.count() === 0,
      timeout,
      `元素 "${this.selector}" 等待从DOM分离超时`
    );
  }

  // =============== 内部方法 ===============

  /**
   * 获取元素数量
   */
  async count() {
    const elements = document.querySelectorAll(this.selector);
    return this.applyFilters(Array.from(elements)).length;
  }

  /**
   * 获取所有匹配的元素
   */
  async all() {
    const elements = document.querySelectorAll(this.selector);
    const filtered = this.applyFilters(Array.from(elements));
    
    return filtered.map(element => {
      const locator = new LocatorAdapter(this.buildUniqueSelector(element), this.page);
      locator._element = element; // 缓存元素
      return locator;
    });
  }

  /**
   * 获取单个元素
   */
  async getElement() {
    // 如果有缓存的元素，直接返回
    if (this._element && document.contains(this._element)) {
      return this._element;
    }

    const elements = document.querySelectorAll(this.selector);
    
    if (elements.length === 0) {
      throw new Error(`找不到元素: ${this.selector}`);
    }

    const filteredElements = this.applyFilters(Array.from(elements));

    if (filteredElements.length === 0) {
      throw new Error(`过滤后找不到元素: ${this.selector}`);
    }

    return filteredElements[0];
  }

  /**
   * 应用过滤器
   */
  applyFilters(elements) {
    let filtered = elements;
    
    for (const filter of this.filters) {
      filtered = this.applyFilter(filtered, filter);
    }

    return filtered;
  }

  /**
   * 应用单个过滤器
   */
  applyFilter(elements, filter) {
    if (typeof filter.position === 'number') {
      return elements[filter.position] ? [elements[filter.position]] : [];
    }
    
    if (filter.position === 'last') {
      return elements.length > 0 ? [elements[elements.length - 1]] : [];
    }

    if (filter.hasText) {
      return elements.filter(el => {
        const text = el.textContent || el.innerText || '';
        return filter.exact ? text === filter.hasText : text.includes(filter.hasText);
      });
    }

    if (filter.hasNotText) {
      return elements.filter(el => {
        const text = el.textContent || el.innerText || '';
        return !text.includes(filter.hasNotText);
      });
    }

    return elements;
  }

  /**
   * 构建唯一选择器
   */
  buildUniqueSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }
    
    // 构建路径选择器
    const path = [];
    let current = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.className) {
        const classes = current.className.split(' ').filter(c => c.trim());
        if (classes.length > 0) {
          selector += '.' + classes.join('.');
        }
      }
      
      // 添加位置信息以确保唯一性
      const siblings = Array.from(current.parentNode?.children || [])
        .filter(sibling => sibling.tagName === current.tagName);
      
      if (siblings.length > 1) {
        const index = siblings.indexOf(current);
        selector += `:nth-of-type(${index + 1})`;
      }
      
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }
}

// 导出给浏览器使用
if (typeof window !== 'undefined') {
  window.PlaywrightLocatorAdapter = LocatorAdapter;
}

// Node.js 环境
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LocatorAdapter;
}

// ES6 模块导出
export default LocatorAdapter;