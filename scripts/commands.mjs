export const commandAssets = `<link rel="stylesheet" href="/commands.css">
  <script src="/commands.js" defer></script>`;

export const commandPalette = `<dialog class="command-palette" aria-labelledby="command-title" data-clarity-mask="true">
    <form class="command-form">
      <div class="command-heading">
        <h2 id="command-title">Commands</h2>
        <button type="button" data-close-commands>Close</button>
      </div>
      <label class="command-label" for="command-input">Type a command</label>
      <input id="command-input" type="text" placeholder="Type a command…" autocomplete="off" autocapitalize="none" spellcheck="false" autofocus>
      <p class="command-feedback" role="status"></p>
    </form>
  </dialog>`;
