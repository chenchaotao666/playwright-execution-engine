/**
 * 事件模拟器 - 模拟各种用户交互事件
 */
class EventSimulator {
  constructor() {
    this.logger = new (window.PlaywrightLogger || console)();
  }

  /**
   * 模拟点击事件
   */
  simulateClick(element, options = {}) {
    const { button = 0, clickCount = 1, delay = 0 } = options;
    
    // 确保元素获得焦点
    element.focus();

    // 触发完整的鼠标事件序列
    const mouseEvents = ['mousedown', 'mouseup', 'click'];
    
    mouseEvents.forEach((eventType, index) => {
      setTimeout(() => {
        const event = new MouseEvent(eventType, {
          view: window,
          bubbles: true,
          cancelable: true,
          button: button,
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
      const dblClickEvent = new MouseEvent('dblclick', {
        view: window,
        bubbles: true,
        cancelable: true,
        detail: 2
      });
      element.dispatchEvent(dblClickEvent);
      this.logger.debug('触发 dblclick 事件');
    }, 100);
  }

  /**
   * 模拟悬停事件
   */
  simulateHover(element) {
    const events = ['mouseover', 'mouseenter'];
    
    events.forEach(eventType => {
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
    
    const keyboardEvents = ['keydown', 'keypress', 'keyup'];
    
    keyboardEvents.forEach(eventType => {
      const event = new KeyboardEvent(eventType, {
        key: key,
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
  async simulateTyping(element, text, options = {}) {
    const { delay = 50 } = options;
    
    element.focus();
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // 更新输入值
      const currentValue = element.value || '';
      element.value = currentValue + char;
      
      // 触发输入事件
      element.dispatchEvent(new Event('input', { bubbles: true }));
      this.simulateKeyPress(element, char);
      
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // 触发 change 事件
    element.dispatchEvent(new Event('change', { bubbles: true }));
    this.logger.debug(`输入文本: "${text}"`);
  }

  /**
   * 模拟表单控件变化
   */
  simulateFormChange(element, value) {
    if (element.type === 'checkbox' || element.type === 'radio') {
      element.checked = value;
    } else if (element.tagName === 'SELECT') {
      element.value = value;
    } else {
      element.value = value;
    }
    
    // 触发相关事件
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    this.logger.debug(`表单控件变化: ${element.tagName} = ${value}`);
  }

  /**
   * 获取键码
   */
  getKeyCode(key) {
    const keyCodes = {
      'Enter': 'Enter',
      'Escape': 'Escape',
      'Tab': 'Tab',
      'Backspace': 'Backspace',
      'Delete': 'Delete',
      'ArrowUp': 'ArrowUp',
      'ArrowDown': 'ArrowDown',
      'ArrowLeft': 'ArrowLeft',
      'ArrowRight': 'ArrowRight',
      ' ': 'Space'
    };
    
    return keyCodes[key] || key;
  }

  /**
   * 滚动元素到可视区域
   */
  async scrollIntoView(element, options = {}) {
    const { behavior = 'smooth', block = 'center' } = options;
    
    element.scrollIntoView({ behavior, block });
    
    // 等待滚动完成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.logger.debug('元素滚动到可视区域');
  }
}

// 导出给浏览器使用
if (typeof window !== 'undefined') {
  window.PlaywrightEventSimulator = EventSimulator;
}

// Node.js 环境
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventSimulator;
}

// ES6 模块导出
export default EventSimulator;