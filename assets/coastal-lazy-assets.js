/*!
 * Coastal Demolitions — activate the theme's lazy assets.
 *
 * u-design ships a LazyLoad library and, in theme.min.css, the rule
 *
 *     [data-lazy]:not(img){background-image:none!important}
 *
 * but nothing on the site ever instantiates the library. Nothing has, on WP
 * Engine either — this is inherited, not something the migration broke. The
 * result is that every deferred asset stays deferred forever:
 *
 *   - 1,107 <img> keep their 1x1 placeholder src (a transparent lazy.png or a
 *     base64 1x1 SVG) while the real file sits unused in data-lazy. They are not
 *     broken images — they load fine, at one pixel — which is why an audit that
 *     looks for naturalWidth === 0 sees nothing wrong.
 *   - 40 section backgrounds, the page banners, stay blank. Their headings are
 *     set in near-white for legibility over the photograph that never arrives.
 *
 * Starting the vendor library would not fix the backgrounds. It assigns a plain
 * inline background-image, and the !important rule above still beats an inline
 * declaration. Removing the attribute is what actually lifts the suppression, so
 * that is what this does — which also lets each section's own Elementor rule
 * apply, keeping the authored background-position and background-size: cover.
 *
 * Deferral is handed to the browser's native loading="lazy" rather than
 * re-implementing an observer, so off-screen images still cost nothing. Images
 * already in view load eagerly, because a lazy logo is a flash of nothing.
 */
(function (w, d) {
  'use strict';

  var EAGER_WITHIN = 1.5; // viewports; anything nearer than this loads now

  function realSrc(el) {
    var src = el.getAttribute('data-lazy');
    return src && src !== 'undefined' ? src : null;
  }

  function clearAttrs(el) {
    el.removeAttribute('data-lazy');
    el.removeAttribute('data-lazyset');
    el.removeAttribute('data-sizes');
    // theme.min.css hangs the whole placeholder state off this class:
    //   .d-lazyload{height:0!important;background:var(--alpha-lazy-load-bg)}
    //   img.d-lazyload[data-lazy$=".png"]{opacity:0}
    //   .overlay-zoom:hover img:not(.d-lazyload){transform:scale(1.08)}
    // So while it is present the image is zero-height, sits on a #f4f4f4 block,
    // is fully transparent if it is a PNG, and its hover zoom is suppressed.
    // Dropping it is the theme's own "loaded" signal.
    el.classList.remove('d-lazyload');
  }

  function loadImage(img) {
    var src = realSrc(img);
    if (!src) {
      clearAttrs(img);
      return;
    }
    var srcset = img.getAttribute('data-lazyset');
    var sizes = img.getAttribute('data-sizes');

    if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
    if (!img.hasAttribute('loading')) {
      var box = img.getBoundingClientRect();
      var near = box.top < w.innerHeight * EAGER_WITHIN;
      // A zero-height box means it has not been laid out (hidden tab, unbuilt
      // carousel); treat that as far away rather than as in view.
      img.setAttribute('loading', near && box.height > 0 ? 'eager' : 'lazy');
    }

    if (srcset) img.srcset = srcset;
    if (sizes) img.sizes = sizes;
    img.src = src;
    clearAttrs(img);

    // The placeholder also carries an inline aspect-ratio spacer, e.g.
    // style="padding-top : 43.36%", which reserves the image's eventual height
    // while .d-lazyload holds it at height:0. Once the class is gone that
    // padding is all that remains, and under Elementor's border-box sizing it
    // eats the whole box: the content height collapses to zero and the image
    // paints nothing. All 398 of these in the repo sit on lazy images and
    // nowhere else, so clearing it here is safe.
    img.style.removeProperty('padding-top');
  }

  function loadBackground(el) {
    var src = realSrc(el);
    clearAttrs(el);
    if (!src) return;
    // Prefer the element's own stylesheet rule, which carries the authored
    // position and sizing. Only paint inline if dropping the attribute was not
    // enough — i.e. the background lived solely in the attribute.
    if (w.getComputedStyle(el).backgroundImage === 'none') {
      el.style.backgroundImage = 'url("' + src.replace(/"/g, '%22') + '")';
    }
  }

  function activate(el) {
    if (el.tagName === 'IMG') loadImage(el);
    else loadBackground(el);
  }

  function sweep(root) {
    var nodes = root.querySelectorAll('[data-lazy]');
    for (var i = 0; i < nodes.length; i++) activate(nodes[i]);
  }

  function start() {
    sweep(d);

    // Slick clones its slides after init and the clones carry the attribute, so
    // one pass at ready is not enough.
    if (!w.MutationObserver) return;
    var watcher = new w.MutationObserver(function (records) {
      for (var i = 0; i < records.length; i++) {
        var added = records[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (node.nodeType !== 1) continue;
          if (node.hasAttribute('data-lazy')) activate(node);
          if (node.querySelectorAll) sweep(node);
        }
      }
    });
    watcher.observe(d.body, { childList: true, subtree: true });

    // Widgets have settled long before this; stop watching rather than leave an
    // observer running for the life of the page.
    w.setTimeout(function () {
      watcher.disconnect();
      sweep(d);
    }, 8000);
  }

  if (d.readyState === 'loading') {
    d.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(window, document);
