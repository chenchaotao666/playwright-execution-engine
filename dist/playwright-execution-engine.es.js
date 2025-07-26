var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
class Logger {
  constructor(level = "info") {
    this.level = level;
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
  }
  debug(message, ...args) {
    if (this.levels[this.level] <= this.levels.debug) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
  info(message, ...args) {
    if (this.levels[this.level] <= this.levels.info) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }
  warn(message, ...args) {
    if (this.levels[this.level] <= this.levels.warn) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }
  error(message, ...args) {
    if (this.levels[this.level] <= this.levels.error) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
  success(message, ...args) {
    if (this.levels[this.level] <= this.levels.info) {
      console.log(`%c[SUCCESS] ${message}`, "color: green", ...args);
    }
  }
}
if (typeof window !== "undefined") {
  window.PlaywrightLogger = Logger;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = Logger;
}
let WaitManager$1 = class WaitManager2 {
  constructor() {
    this.defaultTimeout = 3e4;
    this.logger = new (window.PlaywrightLogger || console)();
  }
  /**
   * 等待元素出现
   */
  waitForElement(_0) {
    return __async(this, arguments, function* (selector, timeout = this.defaultTimeout) {
      return new Promise((resolve, reject) => {
        const startTime2 = Date.now();
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
        timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error(`等待元素超时: ${selector} (${timeout}ms)`));
        }, timeout);
        observer = new MutationObserver(() => {
          const element = document.querySelector(selector);
          if (element) {
            cleanup();
            const elapsed = Date.now() - startTime2;
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
    });
  }
  /**
   * 等待条件满足
   */
  waitForCondition(_0) {
    return __async(this, arguments, function* (conditionFn, timeout = this.defaultTimeout, errorMessage = "等待条件超时") {
      return new Promise((resolve, reject) => {
        const startTime2 = Date.now();
        const check = () => __async(this, null, function* () {
          try {
            const result = yield conditionFn();
            if (result) {
              const elapsed = Date.now() - startTime2;
              this.logger.debug(`条件满足 (${elapsed}ms)`);
              resolve(result);
              return;
            }
          } catch (error) {
            this.logger.debug("条件检查出错，继续等待:", error.message);
          }
          if (Date.now() - startTime2 >= timeout) {
            reject(new Error(`${errorMessage} (${timeout}ms)`));
            return;
          }
          setTimeout(check, 100);
        });
        check();
      });
    });
  }
  /**
   * 等待函数返回真值
   */
  waitForFunction(_0) {
    return __async(this, arguments, function* (fn, timeout = this.defaultTimeout) {
      return this.waitForCondition(fn, timeout, "等待函数条件超时");
    });
  }
  /**
   * 等待 URL 变化
   */
  waitForURL(_0) {
    return __async(this, arguments, function* (urlPattern, timeout = this.defaultTimeout) {
      return this.waitForCondition(
        () => {
          const currentUrl = window.location.href;
          if (typeof urlPattern === "string") {
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
    });
  }
  /**
   * 等待页面加载状态
   */
  waitForLoadState(state = "load") {
    return __async(this, null, function* () {
      return new Promise((resolve) => {
        const checkState = () => {
          if (state === "load" && document.readyState === "complete") {
            this.logger.debug("页面完全加载");
            resolve();
          } else if (state === "domcontentloaded" && document.readyState !== "loading") {
            this.logger.debug("DOM 内容加载完成");
            resolve();
          } else if (state === "networkidle") {
            setTimeout(() => {
              this.logger.debug("网络空闲");
              resolve();
            }, 500);
          }
        };
        if (document.readyState === "complete" && state === "load") {
          resolve();
        } else if (document.readyState !== "loading" && state === "domcontentloaded") {
          resolve();
        } else {
          document.addEventListener("readystatechange", checkState, { once: true });
        }
      });
    });
  }
  /**
   * 简单延时
   */
  waitForTimeout(ms) {
    return __async(this, null, function* () {
      this.logger.debug(`等待 ${ms}ms`);
      return new Promise((resolve) => setTimeout(resolve, ms));
    });
  }
};
if (typeof window !== "undefined") {
  window.PlaywrightWaitManager = WaitManager$1;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = WaitManager$1;
}
let EventSimulator$1 = class EventSimulator2 {
  constructor() {
    this.logger = new (window.PlaywrightLogger || console)();
  }
  /**
   * 模拟点击事件
   */
  simulateClick(element, options = {}) {
    const { button = 0, clickCount = 1, delay = 0 } = options;
    element.focus();
    const mouseEvents = ["mousedown", "mouseup", "click"];
    mouseEvents.forEach((eventType, index) => {
      setTimeout(() => {
        const event = new MouseEvent(eventType, {
          view: window,
          bubbles: true,
          cancelable: true,
          button,
          detail: clickCount
        });
        element.dispatchEvent(event);
        this.logger.debug(`触发 ${eventType} 事件`);
      }, delay * index);
    });
  }
  /**
   * 模拟双击事件
   */
  simulateDoubleClick(element) {
    this.simulateClick(element, { clickCount: 1 });
    setTimeout(() => {
      const dblClickEvent = new MouseEvent("dblclick", {
        view: window,
        bubbles: true,
        cancelable: true,
        detail: 2
      });
      element.dispatchEvent(dblClickEvent);
      this.logger.debug("触发 dblclick 事件");
    }, 100);
  }
  /**
   * 模拟悬停事件
   */
  simulateHover(element) {
    const events = ["mouseover", "mouseenter"];
    events.forEach((eventType) => {
      const event = new MouseEvent(eventType, {
        view: window,
        bubbles: true,
        cancelable: true
      });
      element.dispatchEvent(event);
      this.logger.debug(`触发 ${eventType} 事件`);
    });
  }
  /**
   * 模拟键盘事件
   */
  simulateKeyPress(element, key, options = {}) {
    const { ctrlKey = false, shiftKey = false, altKey = false, metaKey = false } = options;
    element.focus();
    const keyboardEvents = ["keydown", "keypress", "keyup"];
    keyboardEvents.forEach((eventType) => {
      const event = new KeyboardEvent(eventType, {
        key,
        code: this.getKeyCode(key),
        bubbles: true,
        cancelable: true,
        ctrlKey,
        shiftKey,
        altKey,
        metaKey
      });
      element.dispatchEvent(event);
      this.logger.debug(`触发 ${eventType} 事件: ${key}`);
    });
  }
  /**
   * 模拟输入序列
   */
  simulateTyping(_0, _1) {
    return __async(this, arguments, function* (element, text, options = {}) {
      const { delay = 50 } = options;
      element.focus();
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const currentValue = element.value || "";
        element.value = currentValue + char;
        element.dispatchEvent(new Event("input", { bubbles: true }));
        this.simulateKeyPress(element, char);
        if (delay > 0) {
          yield new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
      element.dispatchEvent(new Event("change", { bubbles: true }));
      this.logger.debug(`输入文本: "${text}"`);
    });
  }
  /**
   * 模拟表单控件变化
   */
  simulateFormChange(element, value) {
    if (element.type === "checkbox" || element.type === "radio") {
      element.checked = value;
    } else if (element.tagName === "SELECT") {
      element.value = value;
    } else {
      element.value = value;
    }
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    this.logger.debug(`表单控件变化: ${element.tagName} = ${value}`);
  }
  /**
   * 获取键码
   */
  getKeyCode(key) {
    const keyCodes = {
      "Enter": "Enter",
      "Escape": "Escape",
      "Tab": "Tab",
      "Backspace": "Backspace",
      "Delete": "Delete",
      "ArrowUp": "ArrowUp",
      "ArrowDown": "ArrowDown",
      "ArrowLeft": "ArrowLeft",
      "ArrowRight": "ArrowRight",
      " ": "Space"
    };
    return keyCodes[key] || key;
  }
  /**
   * 滚动元素到可视区域
   */
  scrollIntoView(_0) {
    return __async(this, arguments, function* (element, options = {}) {
      const { behavior = "smooth", block = "center" } = options;
      element.scrollIntoView({ behavior, block });
      yield new Promise((resolve) => setTimeout(resolve, 100));
      this.logger.debug("元素滚动到可视区域");
    });
  }
};
if (typeof window !== "undefined") {
  window.PlaywrightEventSimulator = EventSimulator$1;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = EventSimulator$1;
}
let LocatorAdapter$1 = class LocatorAdapter2 {
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
    const newLocator = new LocatorAdapter2(this.selector, this.page);
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
    return this.filter({ position: "last" });
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
  click() {
    return __async(this, arguments, function* (options = {}) {
      const element = yield this.getElement();
      yield this.page.scrollIntoViewIfNeeded(element);
      this.eventSimulator.simulateClick(element, options);
      this.logger.debug(`点击元素: ${this.selector}`);
    });
  }
  /**
   * 双击元素
   */
  dblclick() {
    return __async(this, arguments, function* (options = {}) {
      const element = yield this.getElement();
      yield this.page.scrollIntoViewIfNeeded(element);
      this.eventSimulator.simulateDoubleClick(element);
      this.logger.debug(`双击元素: ${this.selector}`);
    });
  }
  /**
   * 填充表单
   */
  fill(_0) {
    return __async(this, arguments, function* (value, options = {}) {
      const element = yield this.getElement();
      yield this.page.scrollIntoViewIfNeeded(element);
      element.value = "";
      element.value = value;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      this.logger.debug(`填充元素: ${this.selector} = "${value}"`);
    });
  }
  /**
   * 按键操作
   */
  press(_0) {
    return __async(this, arguments, function* (key, options = {}) {
      const element = yield this.getElement();
      element.focus();
      this.eventSimulator.simulateKeyPress(element, key, options);
      this.logger.debug(`按键: ${this.selector} -> ${key}`);
    });
  }
  /**
   * 逐字符输入（模拟打字）
   */
  pressSequentially(_0) {
    return __async(this, arguments, function* (text, options = {}) {
      const element = yield this.getElement();
      yield this.eventSimulator.simulateTyping(element, text, options);
      this.logger.debug(`逐字符输入: ${this.selector} -> "${text}"`);
    });
  }
  /**
   * 悬停
   */
  hover() {
    return __async(this, null, function* () {
      const element = yield this.getElement();
      yield this.page.scrollIntoViewIfNeeded(element);
      this.eventSimulator.simulateHover(element);
      this.logger.debug(`悬停元素: ${this.selector}`);
    });
  }
  /**
   * 选择复选框
   */
  check() {
    return __async(this, null, function* () {
      const element = yield this.getElement();
      if (element.type === "checkbox" || element.type === "radio") {
        element.checked = true;
        element.dispatchEvent(new Event("change", { bubbles: true }));
        this.logger.debug(`选择复选框: ${this.selector}`);
      }
    });
  }
  /**
   * 取消选择复选框
   */
  uncheck() {
    return __async(this, null, function* () {
      const element = yield this.getElement();
      if (element.type === "checkbox") {
        element.checked = false;
        element.dispatchEvent(new Event("change", { bubbles: true }));
        this.logger.debug(`取消选择复选框: ${this.selector}`);
      }
    });
  }
  /**
   * 选择下拉选项
   */
  selectOption(_0) {
    return __async(this, arguments, function* (values, options = {}) {
      const element = yield this.getElement();
      if (element.tagName === "SELECT") {
        if (Array.isArray(values)) {
          Array.from(element.options).forEach((option) => {
            option.selected = values.includes(option.value) || values.includes(option.text);
          });
        } else {
          element.value = values;
        }
        element.dispatchEvent(new Event("change", { bubbles: true }));
        this.logger.debug(`选择下拉选项: ${this.selector} = ${values}`);
      }
    });
  }
  // =============== 状态检查方法 ===============
  /**
   * 检查元素是否可见
   */
  isVisible() {
    return __async(this, null, function* () {
      try {
        const element = yield this.getElement();
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none" && element.offsetParent !== null;
      } catch (e) {
        return false;
      }
    });
  }
  /**
   * 检查元素是否隐藏
   */
  isHidden() {
    return __async(this, null, function* () {
      return !(yield this.isVisible());
    });
  }
  /**
   * 检查元素是否启用
   */
  isEnabled() {
    return __async(this, null, function* () {
      try {
        const element = yield this.getElement();
        return !element.disabled && !element.hasAttribute("disabled");
      } catch (e) {
        return false;
      }
    });
  }
  /**
   * 检查元素是否禁用
   */
  isDisabled() {
    return __async(this, null, function* () {
      return !(yield this.isEnabled());
    });
  }
  /**
   * 检查复选框是否选中
   */
  isChecked() {
    return __async(this, null, function* () {
      try {
        const element = yield this.getElement();
        return element.checked || false;
      } catch (e) {
        return false;
      }
    });
  }
  // =============== 内容获取方法 ===============
  /**
   * 获取文本内容
   */
  textContent() {
    return __async(this, null, function* () {
      const element = yield this.getElement();
      return element.textContent || "";
    });
  }
  /**
   * 获取内部文本
   */
  innerText() {
    return __async(this, null, function* () {
      const element = yield this.getElement();
      return element.innerText || "";
    });
  }
  /**
   * 获取 HTML 内容
   */
  innerHTML() {
    return __async(this, null, function* () {
      const element = yield this.getElement();
      return element.innerHTML || "";
    });
  }
  /**
   * 获取属性值
   */
  getAttribute(name) {
    return __async(this, null, function* () {
      const element = yield this.getElement();
      return element.getAttribute(name);
    });
  }
  /**
   * 获取输入值
   */
  inputValue() {
    return __async(this, null, function* () {
      const element = yield this.getElement();
      return element.value || "";
    });
  }
  // =============== 等待方法 ===============
  /**
   * 等待元素状态
   */
  waitFor() {
    return __async(this, arguments, function* (options = {}) {
      const { state = "visible", timeout = 3e4 } = options;
      switch (state) {
        case "visible":
          return this.waitForVisible(timeout);
        case "hidden":
          return this.waitForHidden(timeout);
        case "attached":
          return this.waitForAttached(timeout);
        case "detached":
          return this.waitForDetached(timeout);
        default:
          throw new Error(`未知的等待状态: ${state}`);
      }
    });
  }
  waitForVisible(timeout) {
    return __async(this, null, function* () {
      return this.waitManager.waitForCondition(
        () => this.isVisible(),
        timeout,
        `元素 "${this.selector}" 等待可见超时`
      );
    });
  }
  waitForHidden(timeout) {
    return __async(this, null, function* () {
      return this.waitManager.waitForCondition(
        () => this.isHidden(),
        timeout,
        `元素 "${this.selector}" 等待隐藏超时`
      );
    });
  }
  waitForAttached(timeout) {
    return __async(this, null, function* () {
      return this.waitManager.waitForCondition(
        () => this.count() > 0,
        timeout,
        `元素 "${this.selector}" 等待附加到DOM超时`
      );
    });
  }
  waitForDetached(timeout) {
    return __async(this, null, function* () {
      return this.waitManager.waitForCondition(
        () => this.count() === 0,
        timeout,
        `元素 "${this.selector}" 等待从DOM分离超时`
      );
    });
  }
  // =============== 内部方法 ===============
  /**
   * 获取元素数量
   */
  count() {
    return __async(this, null, function* () {
      const elements = document.querySelectorAll(this.selector);
      return this.applyFilters(Array.from(elements)).length;
    });
  }
  /**
   * 获取所有匹配的元素
   */
  all() {
    return __async(this, null, function* () {
      const elements = document.querySelectorAll(this.selector);
      const filtered = this.applyFilters(Array.from(elements));
      return filtered.map((element) => {
        const locator = new LocatorAdapter2(this.buildUniqueSelector(element), this.page);
        locator._element = element;
        return locator;
      });
    });
  }
  /**
   * 获取单个元素
   */
  getElement() {
    return __async(this, null, function* () {
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
    });
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
    if (typeof filter.position === "number") {
      return elements[filter.position] ? [elements[filter.position]] : [];
    }
    if (filter.position === "last") {
      return elements.length > 0 ? [elements[elements.length - 1]] : [];
    }
    if (filter.hasText) {
      return elements.filter((el) => {
        const text = el.textContent || el.innerText || "";
        return filter.exact ? text === filter.hasText : text.includes(filter.hasText);
      });
    }
    if (filter.hasNotText) {
      return elements.filter((el) => {
        const text = el.textContent || el.innerText || "";
        return !text.includes(filter.hasNotText);
      });
    }
    return elements;
  }
  /**
   * 构建唯一选择器
   */
  buildUniqueSelector(element) {
    var _a;
    if (element.id) {
      return `#${element.id}`;
    }
    const path = [];
    let current = element;
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.className) {
        const classes = current.className.split(" ").filter((c) => c.trim());
        if (classes.length > 0) {
          selector += "." + classes.join(".");
        }
      }
      const siblings = Array.from(((_a = current.parentNode) == null ? void 0 : _a.children) || []).filter((sibling) => sibling.tagName === current.tagName);
      if (siblings.length > 1) {
        const index = siblings.indexOf(current);
        selector += `:nth-of-type(${index + 1})`;
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    return path.join(" > ");
  }
};
if (typeof window !== "undefined") {
  window.PlaywrightLocatorAdapter = LocatorAdapter$1;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = LocatorAdapter$1;
}
let PageAdapter$1 = class PageAdapter2 {
  constructor() {
    this.logger = new (window.PlaywrightLogger || console)();
    this.waitManager = new (window.PlaywrightWaitManager || WaitManager)();
    this.eventSimulator = new (window.PlaywrightEventSimulator || EventSimulator)();
  }
  // =============== 导航方法 ===============
  /**
   * 导航到指定 URL
   */
  goto(_0) {
    return __async(this, arguments, function* (url, options = {}) {
      const { waitUntil = "load", timeout = 3e4 } = options;
      this.logger.info(`导航到: ${url}`);
      if (window.location.href !== url) {
        window.location.href = url;
        yield this.waitForLoadState(waitUntil, timeout);
      }
      return { url: window.location.href, status: 200 };
    });
  }
  /**
   * 后退
   */
  goBack() {
    return __async(this, arguments, function* (options = {}) {
      const { waitUntil = "load" } = options;
      window.history.back();
      yield this.waitForLoadState(waitUntil);
    });
  }
  /**
   * 前进
   */
  goForward() {
    return __async(this, arguments, function* (options = {}) {
      const { waitUntil = "load" } = options;
      window.history.forward();
      yield this.waitForLoadState(waitUntil);
    });
  }
  /**
   * 刷新页面
   */
  reload() {
    return __async(this, arguments, function* (options = {}) {
      const { waitUntil = "load" } = options;
      window.location.reload();
      yield this.waitForLoadState(waitUntil);
    });
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
  title() {
    return __async(this, null, function* () {
      return document.title;
    });
  }
  /**
   * 获取页面内容
   */
  content() {
    return __async(this, null, function* () {
      return document.documentElement.outerHTML;
    });
  }
  // =============== 元素交互方法 ===============
  /**
   * 点击元素
   */
  click(_0) {
    return __async(this, arguments, function* (selector, options = {}) {
      const element = yield this.waitForSelector(selector);
      yield this.scrollIntoViewIfNeeded(element);
      this.eventSimulator.simulateClick(element, options);
      this.logger.debug(`点击: ${selector}`);
    });
  }
  /**
   * 双击元素
   */
  dblclick(_0) {
    return __async(this, arguments, function* (selector, options = {}) {
      const element = yield this.waitForSelector(selector);
      yield this.scrollIntoViewIfNeeded(element);
      this.eventSimulator.simulateDoubleClick(element);
      this.logger.debug(`双击: ${selector}`);
    });
  }
  /**
   * 填充表单
   */
  fill(_0, _1) {
    return __async(this, arguments, function* (selector, value, options = {}) {
      const element = yield this.waitForSelector(selector);
      yield this.scrollIntoViewIfNeeded(element);
      element.value = "";
      element.value = value;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      this.logger.debug(`填充: ${selector} = "${value}"`);
    });
  }
  /**
   * 按键操作
   */
  press(_0, _1) {
    return __async(this, arguments, function* (selector, key, options = {}) {
      const element = yield this.waitForSelector(selector);
      element.focus();
      this.eventSimulator.simulateKeyPress(element, key, options);
      this.logger.debug(`按键: ${selector} -> ${key}`);
    });
  }
  /**
   * 输入文本（模拟打字）
   */
  type(_0, _1) {
    return __async(this, arguments, function* (selector, text, options = {}) {
      const element = yield this.waitForSelector(selector);
      yield this.eventSimulator.simulateTyping(element, text, options);
      this.logger.debug(`输入: ${selector} -> "${text}"`);
    });
  }
  /**
   * 悬停
   */
  hover(selector) {
    return __async(this, null, function* () {
      const element = yield this.waitForSelector(selector);
      yield this.scrollIntoViewIfNeeded(element);
      this.eventSimulator.simulateHover(element);
      this.logger.debug(`悬停: ${selector}`);
    });
  }
  /**
   * 选择复选框
   */
  check(selector) {
    return __async(this, null, function* () {
      const element = yield this.waitForSelector(selector);
      if (element.type === "checkbox" || element.type === "radio") {
        element.checked = true;
        element.dispatchEvent(new Event("change", { bubbles: true }));
        this.logger.debug(`选择: ${selector}`);
      }
    });
  }
  /**
   * 取消选择复选框
   */
  uncheck(selector) {
    return __async(this, null, function* () {
      const element = yield this.waitForSelector(selector);
      if (element.type === "checkbox") {
        element.checked = false;
        element.dispatchEvent(new Event("change", { bubbles: true }));
        this.logger.debug(`取消选择: ${selector}`);
      }
    });
  }
  /**
   * 选择下拉选项
   */
  selectOption(_0, _1) {
    return __async(this, arguments, function* (selector, values, options = {}) {
      const element = yield this.waitForSelector(selector);
      if (element.tagName === "SELECT") {
        if (Array.isArray(values)) {
          Array.from(element.options).forEach((option) => {
            option.selected = values.includes(option.value) || values.includes(option.text);
          });
        } else {
          element.value = values;
        }
        element.dispatchEvent(new Event("change", { bubbles: true }));
        this.logger.debug(`选择选项: ${selector} = ${values}`);
      }
    });
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
    if (level && role === "heading") {
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
    const labelSelector = exact ? `label:contains("${text}")` : `label:contains("${text}")`;
    const selector = `${labelSelector} input, input[id]:has(+ label:contains("${text}")), input[aria-labelledby]:has(~ *:contains("${text}"))`;
    return this.locator(selector);
  }
  /**
   * 根据占位符定位
   */
  getByPlaceholder(text, options = {}) {
    const { exact = false } = options;
    const selector = exact ? `[placeholder="${text}"]` : `[placeholder*="${text}"]`;
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
    const selector = exact ? `[title="${text}"]` : `[title*="${text}"]`;
    return this.locator(selector);
  }
  // =============== 等待方法 ===============
  /**
   * 等待元素
   */
  waitForSelector(_0) {
    return __async(this, arguments, function* (selector, options = {}) {
      const { timeout = 3e4, state = "visible" } = options;
      if (selector.startsWith("xpath=")) {
        return this.waitForXPath(selector.substring(6), { timeout, state });
      }
      const element = yield this.waitManager.waitForElement(selector, timeout);
      if (state === "visible") {
        yield this.waitManager.waitForCondition(
          () => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
          },
          timeout,
          `元素 "${selector}" 等待可见超时`
        );
      }
      return element;
    });
  }
  /**
   * 等待 XPath 元素
   */
  waitForXPath(_0) {
    return __async(this, arguments, function* (xpath, options = {}) {
      const { timeout = 3e4 } = options;
      return this.waitManager.waitForCondition(
        () => {
          const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
          return result.singleNodeValue;
        },
        timeout,
        `XPath 元素等待超时: ${xpath}`
      );
    });
  }
  /**
   * 等待超时
   */
  waitForTimeout(ms) {
    return __async(this, null, function* () {
      return this.waitManager.waitForTimeout(ms);
    });
  }
  /**
   * 等待函数
   */
  waitForFunction(_0, _1) {
    return __async(this, arguments, function* (fn, arg, options = {}) {
      const { timeout = 3e4 } = options;
      return this.waitManager.waitForCondition(
        () => fn(arg),
        timeout,
        "等待函数条件超时"
      );
    });
  }
  /**
   * 等待 URL
   */
  waitForURL(_0) {
    return __async(this, arguments, function* (url, options = {}) {
      const { timeout = 3e4 } = options;
      return this.waitManager.waitForURL(url, timeout);
    });
  }
  /**
   * 等待加载状态
   */
  waitForLoadState(state = "load", timeout = 3e4) {
    return __async(this, null, function* () {
      return this.waitManager.waitForLoadState(state);
    });
  }
  // =============== 脚本执行方法 ===============
  /**
   * 在页面上下文中执行脚本
   */
  evaluate(fn, ...args) {
    return __async(this, null, function* () {
      try {
        return fn.apply(window, args);
      } catch (error) {
        this.logger.error("脚本执行失败:", error);
        throw error;
      }
    });
  }
  /**
   * 在页面上下文中执行脚本并返回句柄
   */
  evaluateHandle(fn, ...args) {
    return __async(this, null, function* () {
      return this.evaluate(fn, ...args);
    });
  }
  /**
   * 添加脚本标签
   */
  addScriptTag() {
    return __async(this, arguments, function* (options = {}) {
      const { url, path, content, type = "text/javascript" } = options;
      const script = document.createElement("script");
      script.type = type;
      if (url) {
        script.src = url;
      } else if (content) {
        script.textContent = content;
      }
      document.head.appendChild(script);
      if (url) {
        yield new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }
      this.logger.debug("添加脚本标签");
      return script;
    });
  }
  /**
   * 添加样式标签
   */
  addStyleTag() {
    return __async(this, arguments, function* (options = {}) {
      const { url, path, content } = options;
      if (url) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url;
        document.head.appendChild(link);
        return link;
      } else if (content) {
        const style = document.createElement("style");
        style.textContent = content;
        document.head.appendChild(style);
        return style;
      }
    });
  }
  // =============== 辅助方法 ===============
  /**
   * 滚动元素到可视区域
   */
  scrollIntoViewIfNeeded(element) {
    return __async(this, null, function* () {
      const rect = element.getBoundingClientRect();
      const isInViewport = rect.top >= 0 && rect.bottom <= window.innerHeight && rect.left >= 0 && rect.right <= window.innerWidth;
      if (!isInViewport) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        yield this.waitForTimeout(100);
        this.logger.debug("元素滚动到可视区域");
      }
    });
  }
  /**
   * 获取元素边界框
   */
  boundingBox(selector) {
    return __async(this, null, function* () {
      const element = yield this.waitForSelector(selector);
      const rect = element.getBoundingClientRect();
      return {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height
      };
    });
  }
  /**
   * 设置视口大小（有限支持）
   */
  setViewportSize(size) {
    return __async(this, null, function* () {
      this.logger.warn("浏览器环境中无法设置视口大小");
      return { width: window.innerWidth, height: window.innerHeight };
    });
  }
  /**
   * 获取视口大小
   */
  viewportSize() {
    return { width: window.innerWidth, height: window.innerHeight };
  }
};
if (typeof window !== "undefined") {
  window.PlaywrightPageAdapter = PageAdapter$1;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = PageAdapter$1;
}
let ExpectAdapter$1 = class ExpectAdapter2 {
  constructor(target, options = {}) {
    this.target = target;
    this.isNot = false;
    this.timeout = options.timeout || 5e3;
    this.logger = new (window.PlaywrightLogger || console)();
  }
  /**
   * 取反
   */
  get not() {
    const newExpect = new ExpectAdapter2(this.target, { timeout: this.timeout });
    newExpect.isNot = !this.isNot;
    return newExpect;
  }
  // =============== 可见性断言 ===============
  /**
   * 断言元素可见
   */
  toBeVisible() {
    return __async(this, arguments, function* (options = {}) {
      const timeout = options.timeout || this.timeout;
      const expected = !this.isNot;
      try {
        yield this.waitForCondition(
          () => __async(this, null, function* () {
            const isVisible = yield this.target.isVisible();
            return isVisible === expected;
          }),
          timeout,
          `期望元素${expected ? "可见" : "不可见"}`
        );
        this.logger.debug(`✅ 元素${expected ? "可见" : "不可见"}断言通过`);
      } catch (error) {
        const actualVisible = yield this.target.isVisible();
        throw new Error(`期望元素${expected ? "可见" : "不可见"}，但实际${actualVisible ? "可见" : "不可见"}`);
      }
    });
  }
  /**
   * 断言元素隐藏
   */
  toBeHidden() {
    return __async(this, arguments, function* (options = {}) {
      const timeout = options.timeout || this.timeout;
      const expected = this.isNot;
      try {
        yield this.waitForCondition(
          () => __async(this, null, function* () {
            const isVisible = yield this.target.isVisible();
            return isVisible === expected;
          }),
          timeout,
          `期望元素${expected ? "可见" : "隐藏"}`
        );
        this.logger.debug(`✅ 元素${expected ? "可见" : "隐藏"}断言通过`);
      } catch (error) {
        const actualVisible = yield this.target.isVisible();
        throw new Error(`期望元素${expected ? "可见" : "隐藏"}，但实际${actualVisible ? "可见" : "隐藏"}`);
      }
    });
  }
  // =============== 状态断言 ===============
  /**
   * 断言元素启用
   */
  toBeEnabled() {
    return __async(this, arguments, function* (options = {}) {
      const timeout = options.timeout || this.timeout;
      const expected = !this.isNot;
      try {
        yield this.waitForCondition(
          () => __async(this, null, function* () {
            const isEnabled = yield this.target.isEnabled();
            return isEnabled === expected;
          }),
          timeout,
          `期望元素${expected ? "启用" : "禁用"}`
        );
        this.logger.debug(`✅ 元素${expected ? "启用" : "禁用"}断言通过`);
      } catch (error) {
        const actualEnabled = yield this.target.isEnabled();
        throw new Error(`期望元素${expected ? "启用" : "禁用"}，但实际${actualEnabled ? "启用" : "禁用"}`);
      }
    });
  }
  /**
   * 断言元素禁用
   */
  toBeDisabled() {
    return __async(this, arguments, function* (options = {}) {
      const timeout = options.timeout || this.timeout;
      const expected = this.isNot;
      try {
        yield this.waitForCondition(
          () => __async(this, null, function* () {
            const isEnabled = yield this.target.isEnabled();
            return isEnabled === expected;
          }),
          timeout,
          `期望元素${expected ? "启用" : "禁用"}`
        );
        this.logger.debug(`✅ 元素${expected ? "启用" : "禁用"}断言通过`);
      } catch (error) {
        const actualEnabled = yield this.target.isEnabled();
        throw new Error(`期望元素${expected ? "启用" : "禁用"}，但实际${actualEnabled ? "启用" : "禁用"}`);
      }
    });
  }
  /**
   * 断言复选框选中
   */
  toBeChecked() {
    return __async(this, arguments, function* (options = {}) {
      const timeout = options.timeout || this.timeout;
      const expected = !this.isNot;
      try {
        yield this.waitForCondition(
          () => __async(this, null, function* () {
            const isChecked = yield this.target.isChecked();
            return isChecked === expected;
          }),
          timeout,
          `期望元素${expected ? "选中" : "未选中"}`
        );
        this.logger.debug(`✅ 元素${expected ? "选中" : "未选中"}断言通过`);
      } catch (error) {
        const actualChecked = yield this.target.isChecked();
        throw new Error(`期望元素${expected ? "选中" : "未选中"}，但实际${actualChecked ? "选中" : "未选中"}`);
      }
    });
  }
  // =============== 内容断言 ===============
  /**
   * 断言包含文本
   */
  toHaveText(_0) {
    return __async(this, arguments, function* (expectedText, options = {}) {
      const timeout = options.timeout || this.timeout;
      const useInnerText = options.useInnerText || false;
      try {
        yield this.waitForCondition(
          () => __async(this, null, function* () {
            const actualText = useInnerText ? yield this.target.innerText() : yield this.target.textContent();
            let matches;
            if (Array.isArray(expectedText)) {
              matches = expectedText.every((text) => actualText.includes(text));
            } else if (expectedText instanceof RegExp) {
              matches = expectedText.test(actualText);
            } else {
              matches = actualText.includes(expectedText);
            }
            return this.isNot ? !matches : matches;
          }),
          timeout,
          `期望文本${this.isNot ? "不" : ""}包含 "${expectedText}"`
        );
        this.logger.debug(`✅ 文本${this.isNot ? "不" : ""}包含断言通过`);
      } catch (error) {
        const actualText = useInnerText ? yield this.target.innerText() : yield this.target.textContent();
        throw new Error(`期望文本${this.isNot ? "不" : ""}包含 "${expectedText}"，但实际文本为 "${actualText}"`);
      }
    });
  }
  /**
   * 断言确切文本
   */
  toHaveExactText(_0) {
    return __async(this, arguments, function* (expectedText, options = {}) {
      const timeout = options.timeout || this.timeout;
      const useInnerText = options.useInnerText || false;
      try {
        yield this.waitForCondition(
          () => __async(this, null, function* () {
            const actualText = useInnerText ? yield this.target.innerText() : yield this.target.textContent();
            const matches = actualText.trim() === expectedText.trim();
            return this.isNot ? !matches : matches;
          }),
          timeout,
          `期望文本${this.isNot ? "不" : ""}完全匹配 "${expectedText}"`
        );
        this.logger.debug(`✅ 确切文本${this.isNot ? "不" : ""}匹配断言通过`);
      } catch (error) {
        const actualText = useInnerText ? yield this.target.innerText() : yield this.target.textContent();
        throw new Error(`期望文本${this.isNot ? "不" : ""}完全匹配 "${expectedText}"，但实际文本为 "${actualText}"`);
      }
    });
  }
  /**
   * 断言包含文本（部分）
   */
  toContainText(_0) {
    return __async(this, arguments, function* (expectedText, options = {}) {
      return this.toHaveText(expectedText, options);
    });
  }
  // =============== 属性断言 ===============
  /**
   * 断言有属性
   */
  toHaveAttribute(_0, _1) {
    return __async(this, arguments, function* (name, value, options = {}) {
      const timeout = options.timeout || this.timeout;
      try {
        yield this.waitForCondition(
          () => __async(this, null, function* () {
            const actualValue = yield this.target.getAttribute(name);
            let matches;
            if (value === void 0) {
              matches = actualValue !== null;
            } else if (value instanceof RegExp) {
              matches = value.test(actualValue || "");
            } else {
              matches = actualValue === value;
            }
            return this.isNot ? !matches : matches;
          }),
          timeout,
          `期望${this.isNot ? "不" : ""}有属性 "${name}"`
        );
        this.logger.debug(`✅ 属性${this.isNot ? "不" : ""}存在断言通过`);
      } catch (error) {
        const actualValue = yield this.target.getAttribute(name);
        throw new Error(`期望${this.isNot ? "不" : ""}有属性 "${name}"${value !== void 0 ? ` = "${value}"` : ""}，但实际值为 "${actualValue}"`);
      }
    });
  }
  /**
   * 断言有值
   */
  toHaveValue(_0) {
    return __async(this, arguments, function* (expectedValue, options = {}) {
      const timeout = options.timeout || this.timeout;
      try {
        yield this.waitForCondition(
          () => __async(this, null, function* () {
            const actualValue = yield this.target.inputValue();
            let matches;
            if (expectedValue instanceof RegExp) {
              matches = expectedValue.test(actualValue);
            } else {
              matches = actualValue === expectedValue;
            }
            return this.isNot ? !matches : matches;
          }),
          timeout,
          `期望值${this.isNot ? "不" : ""}为 "${expectedValue}"`
        );
        this.logger.debug(`✅ 值${this.isNot ? "不" : ""}匹配断言通过`);
      } catch (error) {
        const actualValue = yield this.target.inputValue();
        throw new Error(`期望值${this.isNot ? "不" : ""}为 "${expectedValue}"，但实际值为 "${actualValue}"`);
      }
    });
  }
  /**
   * 断言有类名
   */
  toHaveClass(_0) {
    return __async(this, arguments, function* (expectedClass, options = {}) {
      const timeout = options.timeout || this.timeout;
      try {
        yield this.waitForCondition(
          () => __async(this, null, function* () {
            const classAttr = yield this.target.getAttribute("class");
            const classes = classAttr ? classAttr.split(" ") : [];
            let matches;
            if (Array.isArray(expectedClass)) {
              matches = expectedClass.every((cls) => classes.includes(cls));
            } else if (expectedClass instanceof RegExp) {
              matches = expectedClass.test(classAttr || "");
            } else {
              matches = classes.includes(expectedClass);
            }
            return this.isNot ? !matches : matches;
          }),
          timeout,
          `期望${this.isNot ? "不" : ""}有类名 "${expectedClass}"`
        );
        this.logger.debug(`✅ 类名${this.isNot ? "不" : ""}存在断言通过`);
      } catch (error) {
        const classAttr = yield this.target.getAttribute("class");
        throw new Error(`期望${this.isNot ? "不" : ""}有类名 "${expectedClass}"，但实际类名为 "${classAttr}"`);
      }
    });
  }
  /**
   * 断言有 ID
   */
  toHaveId(_0) {
    return __async(this, arguments, function* (expectedId, options = {}) {
      return this.toHaveAttribute("id", expectedId, options);
    });
  }
  // =============== 数量断言 ===============
  /**
   * 断言数量
   */
  toHaveCount(_0) {
    return __async(this, arguments, function* (expectedCount, options = {}) {
      const timeout = options.timeout || this.timeout;
      try {
        yield this.waitForCondition(
          () => __async(this, null, function* () {
            const actualCount = yield this.target.count();
            const matches = actualCount === expectedCount;
            return this.isNot ? !matches : matches;
          }),
          timeout,
          `期望数量${this.isNot ? "不" : ""}为 ${expectedCount}`
        );
        this.logger.debug(`✅ 数量${this.isNot ? "不" : ""}匹配断言通过`);
      } catch (error) {
        const actualCount = yield this.target.count();
        throw new Error(`期望数量${this.isNot ? "不" : ""}为 ${expectedCount}，但实际数量为 ${actualCount}`);
      }
    });
  }
  // =============== URL 断言 ===============
  /**
   * 断言 URL
   */
  toHaveURL(_0) {
    return __async(this, arguments, function* (expectedUrl, options = {}) {
      const timeout = options.timeout || this.timeout;
      try {
        yield this.waitForCondition(
          () => {
            const currentUrl = window.location.href;
            let matches;
            if (expectedUrl instanceof RegExp) {
              matches = expectedUrl.test(currentUrl);
            } else {
              matches = currentUrl.includes(expectedUrl);
            }
            return this.isNot ? !matches : matches;
          },
          timeout,
          `期望 URL ${this.isNot ? "不" : ""}匹配 "${expectedUrl}"`
        );
        this.logger.debug(`✅ URL ${this.isNot ? "不" : ""}匹配断言通过`);
      } catch (error) {
        const currentUrl = window.location.href;
        throw new Error(`期望 URL ${this.isNot ? "不" : ""}匹配 "${expectedUrl}"，但当前 URL 为 "${currentUrl}"`);
      }
    });
  }
  /**
   * 断言标题
   */
  toHaveTitle(_0) {
    return __async(this, arguments, function* (expectedTitle, options = {}) {
      const timeout = options.timeout || this.timeout;
      try {
        yield this.waitForCondition(
          () => {
            const currentTitle = document.title;
            let matches;
            if (expectedTitle instanceof RegExp) {
              matches = expectedTitle.test(currentTitle);
            } else {
              matches = currentTitle.includes(expectedTitle);
            }
            return this.isNot ? !matches : matches;
          },
          timeout,
          `期望标题${this.isNot ? "不" : ""}匹配 "${expectedTitle}"`
        );
        this.logger.debug(`✅ 标题${this.isNot ? "不" : ""}匹配断言通过`);
      } catch (error) {
        const currentTitle = document.title;
        throw new Error(`期望标题${this.isNot ? "不" : ""}匹配 "${expectedTitle}"，但当前标题为 "${currentTitle}"`);
      }
    });
  }
  // =============== 辅助方法 ===============
  /**
   * 等待条件满足
   */
  waitForCondition(conditionFn, timeout, description) {
    return __async(this, null, function* () {
      const startTime2 = Date.now();
      const check = () => __async(this, null, function* () {
        try {
          const result = yield conditionFn();
          if (result) {
            return result;
          }
        } catch (error) {
        }
        if (Date.now() - startTime2 >= timeout) {
          throw new Error(`${description}超时 (${timeout}ms)`);
        }
        yield new Promise((resolve) => setTimeout(resolve, 100));
        return check();
      });
      return check();
    });
  }
};
function createExpect() {
  return function expect(target) {
    return new ExpectAdapter$1(target);
  };
}
if (typeof window !== "undefined") {
  window.PlaywrightExpectAdapter = ExpectAdapter$1;
  window.PlaywrightExpect = createExpect();
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ExpectAdapter: ExpectAdapter$1, createExpect };
}
let PlaywrightRuntime$1 = class PlaywrightRuntime2 {
  constructor() {
    this.logger = new (window.PlaywrightLogger || console)();
    this.setupGlobalEnvironment();
  }
  /**
   * 设置全局环境
   */
  setupGlobalEnvironment() {
    window.PlaywrightTest = {
      test: this.createTestFunction(),
      expect: window.PlaywrightExpect || this.createExpectFunction()
    };
    this.setupModuleSystem();
    this.logger.debug("Playwright 运行时环境初始化完成");
  }
  /**
   * 创建 test 函数
   */
  createTestFunction() {
    const self = this;
    function test(name, testFn) {
      return {
        name,
        fn: testFn,
        run: () => __async(this, null, function* () {
          const page = new (window.PlaywrightPageAdapter || PageAdapter)();
          const context = { page };
          try {
            self.logger.info(`🧪 开始测试: ${name}`);
            const startTime2 = Date.now();
            yield testFn(context);
            const duration = Date.now() - startTime2;
            self.logger.success(`✅ 测试通过: ${name} (${duration}ms)`);
            return { success: true, duration, name };
          } catch (error) {
            const duration = Date.now() - startTime;
            self.logger.error(`❌ 测试失败: ${name} (${duration}ms)`, error);
            return { success: false, error, duration, name };
          }
        })
      };
    }
    test.skip = (name, testFn) => {
      self.logger.warn(`⏭️ 跳过测试: ${name}`);
      return {
        name,
        fn: testFn,
        skipped: true,
        run: () => __async(this, null, function* () {
          return { success: true, skipped: true, name };
        })
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
    if (typeof window.importShim === "undefined") {
      window.importShim = {
        "@playwright/test": window.PlaywrightTest
      };
    }
  }
  /**
   * 直接执行 Playwright 脚本
   */
  executeScript(scriptContent) {
    return __async(this, null, function* () {
      try {
        const transformedScript = this.transformImports(scriptContent);
        const testCases = yield this.runInSandbox(transformedScript);
        const results = yield this.runTests(testCases);
        return results;
      } catch (error) {
        this.logger.error("脚本执行失败:", error);
        throw error;
      }
    });
  }
  /**
   * 转换 import 语句
   */
  transformImports(scriptContent) {
    let transformed = scriptContent;
    const importPatterns = [
      // import { test, expect } from '@playwright/test';
      /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@playwright\/test['"];?/g,
      // import { expect, test } from '@playwright/test';
      /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@playwright\/test['"];?/g,
      // import * as pw from '@playwright/test';
      /import\s*\*\s*as\s+(\w+)\s*from\s*['"]@playwright\/test['"];?/g
    ];
    transformed = transformed.replace(importPatterns[0], (match, imports) => {
      const importItems = imports.split(",").map((item) => item.trim());
      const declarations = importItems.map((item) => {
        const cleanItem = item.replace(/\s+as\s+\w+/, "");
        return `${item} = window.PlaywrightTest.${cleanItem}`;
      }).join(", ");
      return `const { ${declarations} } = window.PlaywrightTest;`;
    });
    transformed = transformed.replace(importPatterns[2], (match, namespace) => {
      return `const ${namespace} = window.PlaywrightTest;`;
    });
    transformed = transformed.replace(
      /import\s*{\s*test,?\s*expect\s*}\s*from\s*['"]@playwright\/test['"];?/g,
      "const { test, expect } = window.PlaywrightTest;"
    ).replace(
      /import\s*{\s*expect,?\s*test\s*}\s*from\s*['"]@playwright\/test['"];?/g,
      "const { test, expect } = window.PlaywrightTest;"
    );
    this.logger.debug("Import 语句转换完成");
    return transformed;
  }
  /**
   * 在沙箱环境中执行脚本
   */
  runInSandbox(scriptContent) {
    return __async(this, null, function* () {
      const testCases = [];
      const originalTest = window.PlaywrightTest.test;
      const self = this;
      window.PlaywrightTest.test = function(name, fn) {
        const testCase = originalTest(name, fn);
        testCases.push(testCase);
        self.logger.debug(`收集测试用例: ${name}`);
        return testCase;
      };
      Object.keys(originalTest).forEach((key) => {
        if (typeof originalTest[key] === "function") {
          window.PlaywrightTest.test[key] = originalTest[key];
        }
      });
      try {
        const scriptFunction = new Function(scriptContent);
        scriptFunction();
        this.logger.info(`收集到 ${testCases.length} 个测试用例`);
      } catch (error) {
        this.logger.error("脚本执行出错:", error);
        throw error;
      } finally {
        window.PlaywrightTest.test = originalTest;
      }
      return testCases;
    });
  }
  /**
   * 运行测试
   */
  runTests(testCases) {
    return __async(this, null, function* () {
      const results = [];
      const onlyTests = testCases.filter((test) => test.only);
      const testsToRun = onlyTests.length > 0 ? onlyTests : testCases.filter((test) => !test.skipped);
      this.logger.info(`开始执行 ${testsToRun.length} 个测试`);
      yield this.runHooks("_beforeAllHooks");
      for (const testCase of testsToRun) {
        try {
          yield this.runHooks("_beforeEachHooks", testCase);
          const result = yield testCase.run();
          results.push(result);
          yield this.runHooks("_afterEachHooks", testCase);
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
      yield this.runHooks("_afterAllHooks");
      this.printTestSummary(results);
      return results;
    });
  }
  /**
   * 运行钩子函数
   */
  runHooks(hookType, testCase = null) {
    return __async(this, null, function* () {
      const test = window.PlaywrightTest.test;
      const hooks = test[hookType] || [];
      for (const hook of hooks) {
        try {
          if (testCase) {
            const page = new (window.PlaywrightPageAdapter || PageAdapter)();
            yield hook({ page });
          } else {
            yield hook();
          }
        } catch (error) {
          this.logger.error(`钩子函数执行失败 (${hookType}):`, error);
        }
      }
    });
  }
  /**
   * 打印测试总结
   */
  printTestSummary(results) {
    const passed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const skipped = results.filter((r) => r.skipped).length;
    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
    this.logger.info(`
📊 测试总结:
   ✅ 通过: ${passed}
   ❌ 失败: ${failed}
   ⏭️ 跳过: ${skipped}
   ⏱️ 总耗时: ${totalDuration}ms
    `);
    if (failed > 0) {
      this.logger.error("失败的测试:");
      results.filter((r) => !r.success).forEach((r) => {
        var _a;
        this.logger.error(`  - ${r.name}: ${(_a = r.error) == null ? void 0 : _a.message}`);
      });
    }
  }
};
if (typeof window !== "undefined") {
  window.PlaywrightRuntime = PlaywrightRuntime$1;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = PlaywrightRuntime$1;
}
class TestRunner {
  constructor(options = {}) {
    this.runtime = new (window.PlaywrightRuntime || PlaywrightRuntime)();
    this.logger = new (window.PlaywrightLogger || console)();
    this.options = __spreadValues({
      timeout: 3e4,
      retries: 0
    }, options);
  }
  /**
   * 从文件加载并执行脚本
   */
  loadAndRun(scriptPath) {
    return __async(this, null, function* () {
      try {
        this.logger.info(`📂 加载脚本: ${scriptPath}`);
        const response = yield fetch(scriptPath);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const scriptContent = yield response.text();
        return yield this.runScript(scriptContent, scriptPath);
      } catch (error) {
        this.logger.error(`脚本加载失败: ${scriptPath}`, error);
        throw error;
      }
    });
  }
  /**
   * 直接执行脚本字符串
   */
  runScript(scriptContent, scriptName = "inline-script") {
    return __async(this, null, function* () {
      try {
        this.logger.info(`🚀 执行脚本: ${scriptName}`);
        const startTime2 = Date.now();
        const results = yield this.runtime.executeScript(scriptContent);
        const duration = Date.now() - startTime2;
        this.logger.success(`✅ 脚本执行完成: ${scriptName} (${duration}ms)`);
        return {
          scriptName,
          duration,
          results,
          success: results.every((r) => r.success || r.skipped)
        };
      } catch (error) {
        this.logger.error(`脚本执行失败: ${scriptName}`, error);
        return {
          scriptName,
          duration: 0,
          results: [],
          success: false,
          error
        };
      }
    });
  }
  /**
   * 执行多个脚本文件
   */
  runScripts(scriptPaths) {
    return __async(this, null, function* () {
      const allResults = [];
      this.logger.info(`📦 批量执行 ${scriptPaths.length} 个脚本`);
      for (const path of scriptPaths) {
        try {
          const result = yield this.loadAndRun(path);
          allResults.push(result);
        } catch (error) {
          allResults.push({
            scriptName: path,
            duration: 0,
            results: [],
            success: false,
            error
          });
        }
      }
      this.printBatchSummary(allResults);
      return allResults;
    });
  }
  /**
   * 从目录批量加载脚本
   */
  runScriptsFromPattern(pattern) {
    return __async(this, null, function* () {
      this.logger.warn("浏览器环境中无法直接扫描文件系统，请使用 runScripts() 方法");
      throw new Error("浏览器环境不支持文件系统扫描");
    });
  }
  /**
   * 设置全局钩子
   */
  setGlobalHooks(hooks) {
    const { beforeAll, afterAll, beforeEach, afterEach } = hooks;
    const test = window.PlaywrightTest.test;
    if (beforeAll) test.beforeAll(beforeAll);
    if (afterAll) test.afterAll(afterAll);
    if (beforeEach) test.beforeEach(beforeEach);
    if (afterEach) test.afterEach(afterEach);
    this.logger.debug("全局钩子设置完成");
  }
  /**
   * 设置全局配置
   */
  configure(config) {
    this.options = __spreadValues(__spreadValues({}, this.options), config);
    this.logger.debug("测试配置更新:", this.options);
  }
  /**
   * 打印批量执行总结
   */
  printBatchSummary(results) {
    const totalScripts = results.length;
    const successfulScripts = results.filter((r) => r.success).length;
    const failedScripts = results.filter((r) => !r.success).length;
    const totalTests = results.reduce((sum, r) => sum + r.results.length, 0);
    const passedTests = results.reduce(
      (sum, r) => sum + r.results.filter((test) => test.success).length,
      0
    );
    const failedTests = results.reduce(
      (sum, r) => sum + r.results.filter((test) => !test.success && !test.skipped).length,
      0
    );
    const skippedTests = results.reduce(
      (sum, r) => sum + r.results.filter((test) => test.skipped).length,
      0
    );
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    this.logger.info(`
🎯 批量执行总结:
📄 脚本统计:
   ✅ 成功: ${successfulScripts}/${totalScripts}
   ❌ 失败: ${failedScripts}/${totalScripts}

🧪 测试统计:
   ✅ 通过: ${passedTests}
   ❌ 失败: ${failedTests}
   ⏭️ 跳过: ${skippedTests}
   📊 总计: ${totalTests}

⏱️ 总耗时: ${totalDuration}ms
    `);
    if (failedScripts > 0) {
      this.logger.error("失败的脚本:");
      results.filter((r) => !r.success).forEach((r) => {
        var _a;
        this.logger.error(`  - ${r.scriptName}: ${((_a = r.error) == null ? void 0 : _a.message) || "未知错误"}`);
      });
    }
  }
  /**
   * 获取执行统计
   */
  getStats(results) {
    var _a, _b, _c, _d, _e;
    if (Array.isArray(results) && ((_a = results[0]) == null ? void 0 : _a.results)) {
      return {
        scripts: {
          total: results.length,
          passed: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length
        },
        tests: {
          total: results.reduce((sum, r) => sum + r.results.length, 0),
          passed: results.reduce(
            (sum, r) => sum + r.results.filter((test) => test.success).length,
            0
          ),
          failed: results.reduce(
            (sum, r) => sum + r.results.filter((test) => !test.success && !test.skipped).length,
            0
          ),
          skipped: results.reduce(
            (sum, r) => sum + r.results.filter((test) => test.skipped).length,
            0
          )
        },
        duration: results.reduce((sum, r) => sum + r.duration, 0)
      };
    } else {
      return {
        tests: {
          total: ((_b = results.results) == null ? void 0 : _b.length) || 0,
          passed: ((_c = results.results) == null ? void 0 : _c.filter((test) => test.success).length) || 0,
          failed: ((_d = results.results) == null ? void 0 : _d.filter((test) => !test.success && !test.skipped).length) || 0,
          skipped: ((_e = results.results) == null ? void 0 : _e.filter((test) => test.skipped).length) || 0
        },
        duration: results.duration || 0
      };
    }
  }
  /**
   * 清理资源
   */
  cleanup() {
    const test = window.PlaywrightTest.test;
    test._beforeAllHooks = [];
    test._afterAllHooks = [];
    test._beforeEachHooks = [];
    test._afterEachHooks = [];
    this.logger.debug("测试运行器清理完成");
  }
}
if (typeof window !== "undefined") {
  window.PlaywrightTestRunner = TestRunner;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = TestRunner;
}
function ensureDependencies() {
  const dependencies = {
    PlaywrightLogger: Logger,
    PlaywrightWaitManager: WaitManager$1,
    PlaywrightEventSimulator: EventSimulator$1,
    PlaywrightLocatorAdapter: LocatorAdapter$1,
    PlaywrightPageAdapter: PageAdapter$1,
    PlaywrightExpectAdapter: ExpectAdapter$1,
    createExpect,
    PlaywrightRuntime: PlaywrightRuntime$1,
    PlaywrightTestRunner: TestRunner
  };
  const missing = Object.entries(dependencies).filter(([name, component]) => !component).map(([name]) => name);
  if (missing.length > 0) {
    console.warn("缺少依赖:", missing);
  }
}
class PlaywrightExecutionEngine {
  constructor(options = {}) {
    ensureDependencies();
    this.options = __spreadValues({
      logLevel: "info",
      timeout: 3e4
    }, options);
    this.logger = new Logger(this.options.logLevel);
    this.runtime = new PlaywrightRuntime$1();
    this.testRunner = new TestRunner(this.options);
    this.logger.info("Playwright 执行引擎初始化完成");
  }
  /**
   * 执行脚本字符串
   */
  runScript(scriptContent, scriptName = "inline") {
    return __async(this, null, function* () {
      return yield this.testRunner.runScript(scriptContent, scriptName);
    });
  }
  /**
   * 加载并执行脚本文件
   */
  loadAndRun(scriptPath) {
    return __async(this, null, function* () {
      return yield this.testRunner.loadAndRun(scriptPath);
    });
  }
  /**
   * 批量执行脚本文件
   */
  runScripts(scriptPaths) {
    return __async(this, null, function* () {
      return yield this.testRunner.runScripts(scriptPaths);
    });
  }
  /**
   * 创建新的 Page 实例
   */
  createPage() {
    return new PageAdapter$1();
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
    this.options = __spreadValues(__spreadValues({}, this.options), config);
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
    return "1.0.0-beta";
  }
  /**
   * 检查浏览器兼容性
   */
  static checkCompatibility() {
    const features = {
      "Promises": typeof Promise !== "undefined",
      "async/await": (() => __async(this, null, function* () {
      }))().constructor === Promise,
      "Fetch API": typeof fetch !== "undefined",
      "MutationObserver": typeof MutationObserver !== "undefined",
      "querySelector": typeof document.querySelector !== "undefined",
      "addEventListener": typeof document.addEventListener !== "undefined"
    };
    const unsupported = Object.entries(features).filter(([feature, supported]) => !supported).map(([feature]) => feature);
    if (unsupported.length > 0) {
      console.warn("浏览器不支持以下功能:", unsupported);
      return false;
    }
    return true;
  }
}
PlaywrightExecutionEngine.create = function(options) {
  if (!PlaywrightExecutionEngine.checkCompatibility()) {
    throw new Error("当前浏览器不支持 Playwright 执行引擎");
  }
  return new PlaywrightExecutionEngine(options);
};
PlaywrightExecutionEngine.run = function(_0) {
  return __async(this, arguments, function* (script, options = {}) {
    const engine = PlaywrightExecutionEngine.create(options);
    return yield engine.runScript(script);
  });
};
PlaywrightExecutionEngine.load = function(_0) {
  return __async(this, arguments, function* (scriptPath, options = {}) {
    const engine = PlaywrightExecutionEngine.create(options);
    return yield engine.loadAndRun(scriptPath);
  });
};
PlaywrightExecutionEngine.Components = {
  Logger,
  WaitManager: WaitManager$1,
  EventSimulator: EventSimulator$1,
  PageAdapter: PageAdapter$1,
  LocatorAdapter: LocatorAdapter$1,
  ExpectAdapter: ExpectAdapter$1,
  Runtime: PlaywrightRuntime$1,
  TestRunner
};
if (typeof window !== "undefined") {
  window.PlaywrightExecutionEngine = PlaywrightExecutionEngine;
  window.PWEngine = PlaywrightExecutionEngine;
  window.runPlaywrightScript = PlaywrightExecutionEngine.run;
  window.loadPlaywrightScript = PlaywrightExecutionEngine.load;
  console.log("🎭 Playwright 执行引擎已加载完成");
  console.log("版本:", PlaywrightExecutionEngine.getVersion());
  console.log("使用方法: new PlaywrightExecutionEngine() 或 PlaywrightExecutionEngine.create()");
}
export {
  EventSimulator$1 as PlaywrightEventSimulator,
  ExpectAdapter$1 as PlaywrightExpectAdapter,
  LocatorAdapter$1 as PlaywrightLocatorAdapter,
  Logger as PlaywrightLogger,
  PageAdapter$1 as PlaywrightPageAdapter,
  PlaywrightRuntime$1 as PlaywrightRuntime,
  TestRunner as PlaywrightTestRunner,
  WaitManager$1 as PlaywrightWaitManager,
  createExpect,
  PlaywrightExecutionEngine as default
};
//# sourceMappingURL=playwright-execution-engine.es.js.map
