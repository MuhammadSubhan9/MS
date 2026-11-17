import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as pause } from 'node:timers/promises';

export async function waitFor(predicate, label, timeout = 12000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await predicate();
    if (value) return value;
    await pause(60);
  }
  throw new Error('Timed out waiting for ' + label);
}

export async function browser() {
  const profile = await mkdtemp(join(tmpdir(), 'portfolio-release-review-'));
  const binary = process.env.CHROME_BIN || (process.platform === 'win32'
    ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : 'google-chrome');
  const child = spawn(binary, [
    '--headless', '--no-first-run', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank',
  ], { windowsHide: true, stdio: 'ignore' });
  const port = await waitFor(() => readFile(join(profile, 'DevToolsActivePort'), 'utf8').then(value => value.split('\n')[0]).catch(() => null), 'browser launch');
  const targets = await fetch('http://127.0.0.1:' + port + '/json/list').then(response => response.json());
  const socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await once(socket, 'open');
  let id = 0;
  const pending = new Map();
  const listeners = [];
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const task = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) task.reject(new Error(message.error.message));
      else task.resolve(message.result);
    } else {
      for (const listener of listeners) listener(message);
    }
  });
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  return {
    call, evaluate, listeners,
    async navigate(url, width = 1280, height = 900) {
      await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
      await call('Page.navigate', { url });
      await waitFor(() => evaluate(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete'`).catch(() => false), 'navigation to ' + url);
      await evaluate('document.fonts.ready.then(() => true)');
    },
    async key(key, code, keyCode, modifiers = 0) {
      const params = { key, code, windowsVirtualKeyCode: keyCode, modifiers };
      await call('Input.dispatchKeyEvent', key === 'Enter' ? { type: 'keyDown', text: '\r', ...params } : { type: 'rawKeyDown', ...params });
      await call('Input.dispatchKeyEvent', { type: 'keyUp', ...params });
    },
    async close() {
      socket.close();
      const exited = once(child, 'exit');
      child.kill();
      await exited;
      await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    },
  };
}
