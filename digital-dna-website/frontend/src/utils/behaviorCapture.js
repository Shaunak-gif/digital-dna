/**
 * Digital DNA – Behavioral Biometrics Capture SDK
 * Captures: keystroke dynamics, mouse/scroll, copy-paste, edit bursts, session timing
 */

class BehaviorCaptureSDK {
  constructor(config = {}) {
    this.sessionId = crypto.randomUUID();
    this.apiEndpoint = config.apiEndpoint || 'http://localhost:8000/api/behavioral';
    this.flushInterval = config.flushInterval || 5000; // ms
    this.events = [];
    this.sessionStart = Date.now();
    this.lastKeystroke = null;
    this.lastMousePos = { x: 0, y: 0 };
    this.mousePath = [];
    this.isCapturing = false;
    this._handlers = {};
  }

  start(formId) {
    if (this.isCapturing) return;
    this.isCapturing = true;
    this.formId = formId;
    this._attachListeners();
    this._startFlushTimer();
    this._log('session_start', { formId, userAgent: navigator.userAgent });
  }

  stop() {
    this.isCapturing = false;
    this._detachListeners();
    clearInterval(this._flushTimer);
    this._flush(true); // final flush
  }

  _attachListeners() {
    const target = document.getElementById(this.formId) || document;

    this._handlers.keydown = (e) => this._onKeyDown(e);
    this._handlers.keyup = (e) => this._onKeyUp(e);
    this._handlers.mousemove = (e) => this._onMouseMove(e);
    this._handlers.click = (e) => this._onMouseClick(e);
    this._handlers.scroll = (e) => this._onScroll(e);
    this._handlers.paste = (e) => this._onPaste(e);
    this._handlers.copy = (e) => this._onCopy(e);
    this._handlers.cut = (e) => this._onCut(e);
    this._handlers.input = (e) => this._onInput(e);
    this._handlers.focus = (e) => this._onFocus(e);
    this._handlers.blur = (e) => this._onBlur(e);
    this._handlers.visibilitychange = () => this._onVisibilityChange();

    target.addEventListener('keydown', this._handlers.keydown);
    target.addEventListener('keyup', this._handlers.keyup);
    target.addEventListener('mousemove', this._handlers.mousemove, { passive: true });
    target.addEventListener('click', this._handlers.click);
    target.addEventListener('scroll', this._handlers.scroll, { passive: true });
    target.addEventListener('paste', this._handlers.paste);
    target.addEventListener('copy', this._handlers.copy);
    target.addEventListener('cut', this._handlers.cut);
    target.addEventListener('input', this._handlers.input);
    target.addEventListener('focus', this._handlers.focus, true);
    target.addEventListener('blur', this._handlers.blur, true);
    document.addEventListener('visibilitychange', this._handlers.visibilitychange);

    this._target = target;
  }

  _detachListeners() {
    if (!this._target) return;
    Object.entries(this._handlers).forEach(([event, handler]) => {
      this._target.removeEventListener(event, handler);
      document.removeEventListener(event, handler);
    });
  }

  _log(type, data = {}) {
    this.events.push({
      t: Date.now() - this.sessionStart, // relative timestamp ms
      type,
      ...data
    });
  }

  _onKeyDown(e) {
    const now = Date.now();
    const iki = this.lastKeystroke ? now - this.lastKeystroke : null; // inter-key interval
    this._log('keydown', {
      key: this._sanitizeKey(e.key),
      code: e.code,
      iki, // inter-key interval ms
      target: e.target?.tagName,
      fieldName: e.target?.name || e.target?.id
    });
    this.lastKeystroke = now;
  }

  _onKeyUp(e) {
    this._log('keyup', {
      key: this._sanitizeKey(e.key),
      code: e.code,
      target: e.target?.tagName
    });
  }

  _onMouseMove(e) {
    // Throttle mouse moves to every 50ms
    const now = Date.now() - this.sessionStart;
    if (this.mousePath.length && now - this.mousePath[this.mousePath.length - 1].t < 50) return;

    const dx = e.clientX - this.lastMousePos.x;
    const dy = e.clientY - this.lastMousePos.y;
    const speed = Math.sqrt(dx * dx + dy * dy);

    this.mousePath.push({ t: now, x: e.clientX, y: e.clientY, speed });
    this.lastMousePos = { x: e.clientX, y: e.clientY };

    if (this.mousePath.length >= 10) {
      this._log('mouse_path_segment', { path: [...this.mousePath] });
      this.mousePath = [];
    }
  }

  _onMouseClick(e) {
    this._log('mouse_click', {
      x: e.clientX,
      y: e.clientY,
      button: e.button,
      target: e.target?.tagName,
      fieldName: e.target?.name || e.target?.id
    });
  }

  _onScroll(e) {
    this._log('scroll', {
      scrollY: window.scrollY,
      scrollX: window.scrollX,
      delta: e.deltaY || 0
    });
  }

  _onPaste(e) {
    const pastedText = e.clipboardData?.getData('text') || '';
    this._log('paste', {
      length: pastedText.length,
      fieldName: e.target?.name || e.target?.id,
      wordCount: pastedText.split(/\s+/).filter(Boolean).length
    });
  }

  _onCopy(e) {
    this._log('copy', { target: e.target?.tagName });
  }

  _onCut(e) {
    this._log('cut', { target: e.target?.tagName });
  }

  _onInput(e) {
    const value = e.target?.value || '';
    this._log('input', {
      fieldName: e.target?.name || e.target?.id,
      length: value.length,
      inputType: e.inputType // insertText, deleteContentBackward, etc.
    });
  }

  _onFocus(e) {
    this._log('field_focus', { fieldName: e.target?.name || e.target?.id });
  }

  _onBlur(e) {
    this._log('field_blur', { fieldName: e.target?.name || e.target?.id });
  }

  _onVisibilityChange() {
    this._log('visibility', { hidden: document.hidden });
  }

  _sanitizeKey(key) {
    // Don't capture actual character values for PII safety
    if (key.length === 1) return 'CHAR';
    return key; // Return special keys: Backspace, Enter, etc.
  }

  _startFlushTimer() {
    this._flushTimer = setInterval(() => this._flush(), this.flushInterval);
  }

  async _flush(isFinal = false) {
    if (!this.events.length) return;
    const batch = [...this.events];
    this.events = [];

    const payload = {
      session_id: this.sessionId,
      form_id: this.formId,
      is_final: isFinal,
      session_duration: Date.now() - this.sessionStart,
      events: batch
    };

    try {
      await fetch(`${this.apiEndpoint}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // Re-queue events if flush fails
      this.events = [...batch, ...this.events];
    }
  }

  async getScore() {
    const resp = await fetch(`${this.apiEndpoint}/score/${this.sessionId}`);
    return resp.json();
  }
}

export default BehaviorCaptureSDK;
