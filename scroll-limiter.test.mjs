import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('./content-scripts/scroll-limiter.js', import.meta.url), 'utf8');

function buildContext() {
  const bodyChildren = [];
  const document = {
    body: {
      children: bodyChildren,
      appendChild(node) {
        bodyChildren.push(node);
      },
    },
    documentElement: { style: {} },
    createElement(tagName) {
      return {
        tagName,
        children: [],
        className: '',
        id: '',
        textContent: '',
        append(...nodes) {
          this.children.push(...nodes);
        },
        appendChild(node) {
          this.children.push(node);
        },
        addEventListener() {},
        remove() {
          this.removed = true;
        },
      };
    },
    getElementById(id) {
      return bodyChildren.find((node) => node.id === id) || null;
    },
  };

  const context = {
    window: {},
    document,
    setTimeout(fn) {
      fn();
      return 1;
    },
    clearTimeout() {},
    console,
  };

  context.window.REVERSA_CONFIG = { domPrefix: 'reversa-ext' };
  context.REVERSA_CONFIG = context.window.REVERSA_CONFIG;
  vm.createContext(context);
  vm.runInContext(source, context);
  return { context, document, bodyChildren };
}

const { context, document, bodyChildren } = buildContext();
const ReversaScrollLimiter = context.window.ReversaScrollLimiter;

assert.ok(ReversaScrollLimiter, 'ReversaScrollLimiter should be exported');
assert.doesNotThrow(() => ReversaScrollLimiter.start(1), 'start() should not crash when timer fires');
assert.equal(bodyChildren.length, 1, 'overlay should be created once the timer triggers');
assert.match(document.body.children[0].children[0].children[0].textContent, /minutos|minuto/i, 'overlay should show a valid message');

console.log('scroll-limiter test passed');
