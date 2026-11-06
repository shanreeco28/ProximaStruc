// Injected into the ProximaStruc page by the desktop shell (never part of the website bundle).
// Draws a thin drag bar with minimise / maximise / close. Uses only DOM property assignments
// (no <style> tags or style attributes) so the site's Content-Security-Policy is not an issue.
(function () {
  if (window.top !== window.self) return
  var HEIGHT = 32
  var BAR_ID = 'px-desktop-titlebar'

  function button(label, glyph, onClick, hoverBg) {
    var b = document.createElement('button')
    b.type = 'button'
    b.setAttribute('aria-label', label)
    b.title = label
    b.textContent = glyph
    b.style.cssText =
      'width:46px;height:' + HEIGHT + 'px;border:0;margin:0;padding:0;background:transparent;' +
      'color:#cfd8e0;font:14px/1 system-ui,sans-serif;cursor:default;outline-offset:-2px'
    b.addEventListener('mouseenter', function () { b.style.background = hoverBg })
    b.addEventListener('mouseleave', function () { b.style.background = 'transparent' })
    b.addEventListener('click', onClick)
    return b
  }

  function build() {
    if (document.getElementById(BAR_ID) || !document.body) return
    var tauri = window.__TAURI__
    var win = tauri && tauri.window && tauri.window.getCurrentWindow()

    var bar = document.createElement('div')
    bar.id = BAR_ID
    bar.setAttribute('data-tauri-drag-region', '')
    bar.style.cssText =
      'position:fixed;top:0;left:0;right:0;height:' + HEIGHT + 'px;z-index:2147483647;' +
      'display:flex;align-items:center;justify-content:space-between;' +
      'background:#14202b;border-bottom:1px solid rgba(255,255,255,0.08);' +
      'user-select:none;-webkit-user-select:none'

    var title = document.createElement('div')
    title.setAttribute('data-tauri-drag-region', '')
    title.textContent = 'ProximaStruc'
    title.style.cssText =
      'padding-left:14px;color:#cfd8e0;font:600 12px/1 system-ui,sans-serif;letter-spacing:.04em'

    var controls = document.createElement('div')
    controls.style.cssText = 'display:flex;height:' + HEIGHT + 'px'

    if (win) {
      controls.appendChild(button('Minimise', '–', function () { win.minimize() }, 'rgba(255,255,255,0.12)'))
      controls.appendChild(button('Maximise or restore', '□', function () { win.toggleMaximize() }, 'rgba(255,255,255,0.12)'))
      controls.appendChild(button('Close', '✕', function () { win.close() }, '#c42b1c'))
    }

    bar.appendChild(title)
    bar.appendChild(controls)
    document.body.appendChild(bar)

    // Make room for the bar. Sites can offset fixed headers with the CSS variable below.
    var root = document.documentElement
    root.classList.add('desktop-shell')
    root.style.setProperty('--desktop-titlebar-height', HEIGHT + 'px')
    root.style.boxSizing = 'border-box'
    root.style.paddingTop = HEIGHT + 'px'
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build)
  } else {
    build()
  }
})()
