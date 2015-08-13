/*
  honeybadger.js v0.3.1
  A JavaScript Notifier for Honeybadger
  https://github.com/honeybadger-io/honeybadger-js
  https://www.honeybadger.io/
  MIT license
*/
(function(window) {
// Generated by CoffeeScript 1.9.3
var helpers;

helpers = {};

helpers.String = function(obj, fallback) {
  if ((obj == null) && (fallback != null)) {
    return String(fallback);
  }
  if (obj == null) {
    return null;
  }
  return String(obj);
};
// Generated by CoffeeScript 1.9.3
var Configuration;

Configuration = (function() {
  Configuration.defaults = {
    api_key: null,
    host: 'api.honeybadger.io',
    ssl: true,
    project_root: window.location.protocol + '//' + window.location.host,
    environment: 'production',
    component: null,
    action: null,
    disabled: false,
    onerror: false,
    debug: false,
    timeout: false
  };

  function Configuration(options) {
    var k, ref, v;
    if (options == null) {
      options = {};
    }
    ref = this.constructor.defaults;
    for (k in ref) {
      v = ref[k];
      this[k] = v;
    }
    for (k in options) {
      v = options[k];
      this[k] = v;
    }
  }

  Configuration.prototype.reset = function() {
    var k, ref, v;
    ref = this.constructor.defaults;
    for (k in ref) {
      v = ref[k];
      this[k] = v;
    }
    return this;
  };

  return Configuration;

})();
// Generated by CoffeeScript 1.9.3
var Notice,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Notice = (function() {
  function Notice(opts, config) {
    var k, ref, ref1, v;
    if (opts == null) {
      opts = {};
    }
    if (config == null) {
      config = Honeybadger.configuration;
    }
    this._sanitize = bind(this._sanitize, this);
    this.log = opts.log || function() {};
    this.stack = helpers.String(opts.stack);
    this.generator = helpers.String(opts.generator);
    this["class"] = helpers.String(opts.name, 'Error');
    this.message = helpers.String(opts.message, 'No message provided');
    this.source = null;
    this.url = helpers.String(document.URL);
    this.project_root = helpers.String(config.project_root);
    this.environment = helpers.String(config.environment);
    this.component = helpers.String(opts.component || config.component);
    this.action = helpers.String(opts.action || config.action);
    this.cgi_data = this._cgiData();
    this.fingerprint = helpers.String(opts.fingerprint);
    this.context = {};
    ref = Honeybadger.context;
    for (k in ref) {
      v = ref[k];
      this.context[k] = v;
    }
    if (opts.context && typeof opts.context === 'object') {
      ref1 = opts.context;
      for (k in ref1) {
        v = ref1[k];
        this.context[k] = v;
      }
    }
  }

  Notice.prototype.payload = function() {
    return this._sanitize({
      notifier: {
        name: 'honeybadger.js',
        url: 'https://github.com/honeybadger-io/honeybadger-js',
        version: Honeybadger.version,
        language: 'javascript'
      },
      error: {
        "class": this["class"],
        message: this.message,
        backtrace: this.stack,
        generator: this.generator,
        source: this.source,
        fingerprint: this.fingerprint
      },
      request: {
        url: this.url,
        component: this.component,
        action: this.action,
        context: this.context,
        cgi_data: this.cgi_data
      },
      server: {
        project_root: this.project_root,
        environment_name: this.environment
      }
    });
  };

  Notice.prototype._cgiData = function() {
    var data, k, v;
    data = {};
    if (typeof navigator !== "undefined" && navigator !== null) {
      for (k in navigator) {
        v = navigator[k];
        if ((k != null) && (v != null) && !(typeof v === 'object')) {
          data[k.replace(/(?=[A-Z][a-z]*)/g, '_').toUpperCase()] = v;
        }
      }
      data['HTTP_USER_AGENT'] = data['USER_AGENT'];
      delete data['USER_AGENT'];
    }
    if (document.referrer.match(/\S/)) {
      data['HTTP_REFERER'] = document.referrer;
    }
    return data;
  };

  Notice.prototype._sanitize = function(obj, seen) {
    var e, k, new_obj, v;
    if (seen == null) {
      seen = [];
    }
    if (obj instanceof Function) {
      return "[FUNC]";
    } else if (obj instanceof Object) {
      if (indexOf.call(seen, obj) >= 0) {
        this.log("Dropping circular data structure.", k, v, obj);
        return "[CIRCULAR DATA STRUCTURE]";
      }
      seen.push(obj);
      if (obj instanceof Array) {
        return obj.map((function(_this) {
          return function(v) {
            return _this._sanitize(v, seen);
          };
        })(this));
      } else {
        new_obj = {};
        try {
          for (k in obj) {
            v = obj[k];
            new_obj[k] = this._sanitize(v, seen);
          }
        } catch (_error) {
          e = _error;
          return {
            error: "Honeybadger was unable to read this object: " + String(e)
          };
        }
        return new_obj;
      }
    }
    return obj;
  };

  return Notice;

})();
// Generated by CoffeeScript 1.9.3
var Client, Honeybadger, UncaughtError, currentError, currentNotice, ref,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  hasProp = {}.hasOwnProperty,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ref = [null, null], currentError = ref[0], currentNotice = ref[1];

Client = (function() {
  Client.prototype.version = '0.3.1';

  function Client(options) {
    this._windowOnErrorHandler = bind(this._windowOnErrorHandler, this);
    this._domReady = bind(this._domReady, this);
    this.log = bind(this.log, this);
    this.log('Initializing honeybadger.js ' + this.version);
    if (options) {
      this.configure(options);
    }
  }

  Client.prototype.log = function() {
    this.log.history = this.log.history || [];
    this.log.history.push(arguments);
    if (this.configuration.debug && window.console) {
      return console.log(Array.prototype.slice.call(arguments));
    }
  };

  Client.prototype.configure = function(options) {
    var args, i, k, len, ref1, v;
    if (options == null) {
      options = {};
    }
    for (k in options) {
      v = options[k];
      this.configuration[k] = v;
    }
    if (!this._configured && this.configuration.debug && window.console) {
      ref1 = this.log.history;
      for (i = 0, len = ref1.length; i < len; i++) {
        args = ref1[i];
        console.log(Array.prototype.slice.call(args));
      }
    }
    this._configured = true;
    return this;
  };

  Client.prototype.configuration = new Configuration();

  Client.prototype.context = {};

  Client.prototype.resetContext = function(options) {
    if (options == null) {
      options = {};
    }
    this.context = options instanceof Object ? options : {};
    return this;
  };

  Client.prototype.setContext = function(options) {
    var k, v;
    if (options == null) {
      options = {};
    }
    if (options instanceof Object) {
      for (k in options) {
        v = options[k];
        this.context[k] = v;
      }
    }
    return this;
  };

  Client.prototype.beforeNotifyHandlers = [];

  Client.prototype.beforeNotify = function(handler) {
    return this.beforeNotifyHandlers.push(handler);
  };

  Client.prototype.notify = function(error, name, opts) {
    var generator, k, notice, ref1, ref2, ref3, ref4, stack, v;
    if (opts == null) {
      opts = {};
    }
    if (!this._validConfig() || this.configuration.disabled === true) {
      return false;
    }
    ref1 = [void 0, void 0], stack = ref1[0], generator = ref1[1];
    if (name instanceof Object) {
      opts = name;
      name = void 0;
    } else if (name != null) {
      opts['name'] = name;
    }
    if (error instanceof Object && (error.error != null)) {
      error = error.error;
      error['error'] = void 0;
    }
    if (error instanceof Error) {
      stack = this._stackTrace(error);
      opts['name'] || (opts['name'] = error.name);
      opts['message'] || (opts['message'] = error.message);
    } else if (typeof error === 'string') {
      opts['message'] = error;
    } else if (error instanceof Object) {
      for (k in error) {
        v = error[k];
        opts[k] = v;
      }
    }
    if (currentNotice) {
      if (error === currentError) {
        return;
      } else if (this._loaded) {
        this._send(currentNotice);
      }
    }
    if (((function() {
      var results;
      results = [];
      for (k in opts) {
        if (!hasProp.call(opts, k)) continue;
        results.push(k);
      }
      return results;
    })()).length === 0) {
      return false;
    }
    if (!stack) {
      ref2 = this._generateStackTrace(), stack = ref2[0], generator = ref2[1];
    }
    ref3 = [stack, generator], opts['stack'] = ref3[0], opts['generator'] = ref3[1];
    notice = this._buildNotice(opts);
    if (this._checkHandlers(this.beforeNotifyHandlers, notice)) {
      return false;
    }
    ref4 = [error, notice], currentError = ref4[0], currentNotice = ref4[1];
    if (!this._loaded) {
      this.log('Queuing notice', notice);
      this._queue.push(notice);
    } else {
      this.log('Defering notice', notice);
      window.setTimeout((function(_this) {
        return function() {
          if (error === currentError) {
            return _this._send(notice);
          }
        };
      })(this));
    }
    return notice;
  };

  Client.prototype.wrap = function(func) {
    var honeybadgerWrapper;
    return honeybadgerWrapper = function() {
      var e;
      try {
        return func.apply(this, arguments);
      } catch (_error) {
        e = _error;
        Honeybadger.notify(e);
        throw e;
      }
    };
  };

  Client.prototype.reset = function() {
    this.resetContext();
    this.configuration.reset();
    this._configured = false;
    return this;
  };

  Client.prototype.install = function() {
    if (this.installed === true) {
      return;
    }
    if (window.onerror !== this._windowOnErrorHandler) {
      this.log('Installing window.onerror handler');
      this._oldOnErrorHandler = window.onerror;
      window.onerror = this._windowOnErrorHandler;
    }
    if (this._loaded) {
      this.log('honeybadger.js ' + this.version + ' ready');
    } else {
      this.log('Installing ready handler');
      if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', this._domReady, true);
        window.addEventListener('load', this._domReady, true);
      } else {
        window.attachEvent('onload', this._domReady);
      }
    }
    this._installed = true;
    return this;
  };

  Client.prototype._queue = [];

  Client.prototype._loaded = document.readyState === 'complete';

  Client.prototype._configured = false;

  Client.prototype._domReady = function() {
    var notice, results;
    if (this._loaded) {
      return;
    }
    this._loaded = true;
    this.log('honeybadger.js ' + this.version + ' ready');
    results = [];
    while (notice = this._queue.pop()) {
      results.push(this._send(notice));
    }
    return results;
  };

  Client.prototype._generateStackTrace = function() {
    var e, stack;
    try {
      throw new Error('');
    } catch (_error) {
      e = _error;
      if (stack = this._stackTrace(e)) {
        return [stack, 'throw'];
      }
    }
    return [];
  };

  Client.prototype._stackTrace = function(error) {
    return (error != null ? error.stacktrace : void 0) || (error != null ? error.stack : void 0) || null;
  };

  Client.prototype._checkHandlers = function(handlers, notice) {
    var handler, i, len;
    for (i = 0, len = handlers.length; i < len; i++) {
      handler = handlers[i];
      if (handler(notice) === false) {
        return true;
      }
    }
    return false;
  };

  Client.prototype._buildNotice = function(opts) {
    return new Notice({
      log: this.log,
      stack: opts['stack'],
      generator: opts['generator'],
      message: opts['message'],
      name: opts['name'],
      fingerprint: opts['fingerprint'],
      context: opts['context'],
      component: opts['component'],
      action: opts['action']
    }, this.configuration);
  };

  Client.prototype._send = function(notice) {
    var ref1;
    this.log('Sending notice', notice);
    ref1 = [null, null], currentError = ref1[0], currentNotice = ref1[1];
    return this._sendRequest(notice.payload());
  };

  Client.prototype._validConfig = function() {
    var ref1;
    if (!this._configured) {
      return false;
    }
    if ((ref1 = this.configuration.api_key) != null ? ref1.match(/\S/) : void 0) {
      return true;
    } else {
      return false;
    }
  };

  Client.prototype._baseURL = function() {
    return 'http' + ((this.configuration.ssl && 's') || '') + '://' + this.configuration.host;
  };

  Client.prototype._sendRequest = function(data) {
    return this._xhrRequest(data) || this._imageRequest(data);
  };

  Client.prototype._imageRequest = function(data) {
    var endpoint, img, ref1, timeout, url;
    endpoint = this._baseURL() + '/v1/notices/js.gif';
    url = endpoint + '?' + this._serialize({
      api_key: this.configuration.api_key,
      notice: data,
      t: new Date().getTime()
    });
    ref1 = [new Image(), null], img = ref1[0], timeout = ref1[1];
    img.onabort = img.onerror = (function(_this) {
      return function() {
        if (timeout) {
          window.clearTimeout(timeout);
        }
        return _this.log('Request failed.', url, data);
      };
    })(this);
    img.onload = (function(_this) {
      return function() {
        if (timeout) {
          return window.clearTimeout(timeout);
        }
      };
    })(this);
    img.src = url;
    if (this.configuration.timeout) {
      timeout = window.setTimeout(((function(_this) {
        return function() {
          img.src = '';
          return _this.log('Request timed out.', url, data);
        };
      })(this)), this.configuration.timeout);
    }
    return true;
  };

  Client.prototype._xhrRequest = function(data) {
    var method, url, xhr;
    if (typeof XMLHttpRequest === 'undefined') {
      return false;
    }
    if (typeof JSON === 'undefined') {
      return false;
    }
    method = 'POST';
    url = this._baseURL() + '/v1/notices/js?api_key=' + this.configuration.api_key;
    xhr = new XMLHttpRequest();
    if ('withCredentials' in xhr) {
      xhr.open(method, url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('X-Api-Key', this.configuration.api_key);
    } else if (typeof XDomainRequest !== 'undefined') {
      xhr = new XDomainRequest();
      xhr.open(method, url);
    } else {
      xhr = null;
    }
    if (xhr) {
      if (this.configuration.timeout) {
        xhr.timeout = this.configuration.timeout;
      }
      xhr.onerror = (function(_this) {
        return function() {
          return _this.log('Request failed.', data, xhr);
        };
      })(this);
      xhr.ontimeout = (function(_this) {
        return function() {
          return _this.log('Request timed out.', data, xhr);
        };
      })(this);
      xhr.onreadystatechange = (function(_this) {
        return function() {
          if (xhr.readyState === 4) {
            if (xhr.status === 201) {
              return _this.log('Request succeeded.', xhr.status, data, xhr);
            } else {
              return _this.log('Request rejected by server.', xhr.status, data, xhr);
            }
          }
        };
      })(this);
      xhr.send(JSON.stringify(data));
      return true;
    }
    return false;
  };

  Client.prototype._serialize = function(obj, prefix) {
    var k, pk, ret, v;
    ret = [];
    for (k in obj) {
      v = obj[k];
      if (obj.hasOwnProperty(k) && (k != null) && (v != null)) {
        pk = (prefix ? prefix + '[' + k + ']' : k);
        ret.push(typeof v === 'object' ? this._serialize(v, pk) : encodeURIComponent(pk) + '=' + encodeURIComponent(v));
      }
    }
    return ret.join('&');
  };

  Client.prototype._windowOnErrorHandler = function(msg, url, line, col, error) {
    if (!currentNotice && this.configuration.onerror) {
      this.log('Error caught by window.onerror', msg, url, line, col, error);
      if (!error) {
        error = new UncaughtError(msg, url, line, col);
      }
      this.notify(error);
    }
    if (this._oldOnErrorHandler) {
      return this._oldOnErrorHandler.apply(this, arguments);
    }
    return false;
  };

  return Client;

})();

UncaughtError = (function(superClass) {
  extend(UncaughtError, superClass);

  function UncaughtError(message, url, line, column) {
    this.name = 'window.onerror';
    this.message = message || 'An unknown error was caught by window.onerror.';
    this.stack = [this.message, '\n    at ? (', url || 'unknown', ':', line || 0, ':', column || 0, ')'].join('');
  }

  return UncaughtError;

})(Error);

Honeybadger = new Client;

Honeybadger.Client = Client;
  window.Honeybadger = Honeybadger;
  Honeybadger.install();
})(window);
