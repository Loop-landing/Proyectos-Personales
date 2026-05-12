(function () {
  var canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var W, H;
  var FS    = 14;
  var drops = [];
  var colColors = [];

  var chars = '01{}[]()<>/\\;:=+-*&|^%#@!?~_.=><=!===&&||0123456789ABCDEFabcdef';

  // Syntax-highlight color palette
  var COLORS = [
    '#00ff41',  // Matrix green
    '#61dafb',  // React cyan
    '#c792ea',  // purple (keywords)
    '#f78c6c',  // orange (numbers)
    '#ffcb6b',  // yellow (strings)
    '#82aaff',  // blue (functions)
    '#ff79c6',  // pink (operators)
    '#00ffff',  // bright cyan
    '#7fdbca',  // teal
    '#addb67',  // lime green
    '#ff6ac1',  // hot pink
    '#9effff',  // light cyan
  ];

  function randColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    var cols = Math.floor(W / FS);
    drops     = [];
    colColors = [];
    for (var i = 0; i < cols; i++) {
      drops.push(Math.floor(Math.random() * -(H / FS)));
      colColors.push(randColor());
    }
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  var tick = 0;

  function frame() {
    tick++;

    if (tick % 2 === 0) {
      // Dark fade — keeps trail short and vivid
      ctx.fillStyle = 'rgba(10,10,10,0.12)';
      ctx.fillRect(0, 0, W, H);

      ctx.font = FS + 'px "Courier New", Courier, monospace';

      for (var i = 0; i < drops.length; i++) {
        var y = drops[i] * FS;

        if (y >= 0 && y <= H + FS) {
          var c = chars[Math.floor(Math.random() * chars.length)];

          // Head: white (always)
          ctx.fillStyle = '#ffffff';
          ctx.fillText(c, i * FS, y);

          // One step behind: column color, bright
          if (drops[i] > 1) {
            var c2 = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillStyle = colColors[i];
            ctx.fillText(c2, i * FS, y - FS);
          }
        }

        drops[i]++;

        // Reset and pick a new color for the column
        if (drops[i] * FS > H && Math.random() > 0.97) {
          drops[i]     = Math.floor(Math.random() * -(H / FS / 3));
          colColors[i] = randColor();
        }
      }
    }

    requestAnimationFrame(frame);
  }

  frame();
})();
