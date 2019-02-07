/**
 * @authors Luke Mahe
 * @authors Eric Bidelman
 * @authors Lukas Pirl
 * @fileoverview TODO
 */
document.cancelFullScreen = document.webkitCancelFullScreen ||
                            document.mozCancelFullScreen;

/**
 * @constructor
 */
function SlideDeck(el) {
  this.curSlide_ = 0;
  this.prevSlide_ = 0;
  this.config_ = null;
  this.container = el || document.querySelector('slides');
  this.slides = [];
  this.controller = null;

  this.getCurrentSlideFromHash_();

  // Call this explicitly. Modernizr.load won't be done until after DOM load.
  this.onDomLoaded_.bind(this)();
}

/**
 * @const
 * @private
 */
SlideDeck.prototype.SLIDE_CLASSES_ = [
  'far-past', 'past', 'current', 'next', 'far-next'];

/**
 * @const
 * @private
 */
SlideDeck.prototype.CSS_DIR_ = '_static/theme/css/';


/**
 * @private
 */
SlideDeck.prototype.findSlideById = function(title_id) {
  // Return the 1-base index of the Slide with id ``title_id``
  //
  // The index must be 1-based, as it's passed to code which assumes
  // it was specified as the location fragment.

  slideEls = document.querySelectorAll('slides > slide');

  for (var i = 0; i < slideEls.length; i++) {
    if (slideEls.item(i).id == title_id) {
      return i + 1;
    }
  }

  // no match on a slide, perhaps it's an explicit reference?
  var
  target_link = document.querySelector("span[id='" + title_id + "']"),
  // XXX this is pretty strict, may need to be more flexible in the future
  slide = (target_link && target_link.parentNode);

  if (slide && slide.tagName == 'SLIDE') {
    return this.findSlideById(slide.id);
  }

  return false;

};

/**
 * @private
 */
SlideDeck.prototype.getCurrentSlideFromHash_ = function() {
  var slideNo = parseInt(document.location.hash.substr(1));

  if (slideNo && isNaN(slideNo)) {
      // must be a section title reference
      slideNo = this.findSlideById(location.hash.substr(1));
  }

  if (slideNo) {
    this.curSlide_ = slideNo - 1;
  } else {
    this.curSlide_ = 0;
  }
};

/**
 * @private
 */
SlideDeck.prototype.onDomLoaded_ = function(e) {

  this.slides = this.container.querySelectorAll(
    'slide:not([hidden]):not(.hidden)'
  );

  this.loadConfig_();
  this.addEventListeners_();
  this.updateSlides_();

  var that = this;
  for (var i = 0, slide; slide = this.slides[i]; ++i) {
    (function(i) {
      slide.addEventListener('click', function(e) {
        if (document.body.classList.contains('overview')) {
          e.preventDefault();
          that.setSlide(i);
          document.body.classList.toggle('overview');
        }
      }, false);
    })(i);
  }

  // Note: this needs to come after addEventListeners_(), which adds a
  // 'keydown' listener that this controller relies on.
  this.controller = new SlideController(this);

  if (this.controller.isPopup) {
    document.body.classList.add('popup');
    document.body.classList.add('with-notes');
  }


  // initially zoom slides to window size
  window.dispatchEvent(new Event('resize'));
  document.body.classList.add('loaded');
};

/**
 * @private
 */
SlideDeck.prototype.addEventListeners_ = function() {
  document.addEventListener('keydown', this.onBodyKeyDown_.bind(this), false);
  window.addEventListener('popstate', this.onPopState_.bind(this), false);
  window.addEventListener('resize', this.onWindowResize_.bind(this), false);
  window.matchMedia('print').addListener(this.onPrint_.bind(this));

  if (Modernizr.touch) {
    var self = this;

    // Note: this prevents mobile zoom in/out but prevents iOS from doing
    // it's crazy scroll over effect and disaligning the slides.
    window.addEventListener('touchstart', function(e) {
      e.preventDefault();
    }, false);

    var hammer = new Hammer(this.container);
    hammer.ondragend = function(e) {
      if (e.direction == 'right' || e.direction == 'down') {
        self.prevSlide();
      } else if (e.direction == 'left' || e.direction == 'up') {
        self.nextSlideStep();
      }
    };
  }
};

/**
 * @private
 * @param {Event} e The pop event.
 */
SlideDeck.prototype.onPopState_ = function(e) {
  if (e.state != null) {
    this.curSlide_ = e.state;
    this.updateSlides_(true);
  }
};

/**
 * @param {Event} e
 */
SlideDeck.prototype.onBodyKeyDown_ = function(e) {
  if (/^(input|textarea)$/i.test(e.target.nodeName) ||
      e.target.isContentEditable) {
    return;
  }

  // Forward keydowns to the main slides if we're the popup.
  if (this.controller && this.controller.isPopup) {
    this.controller.sendMsg({keyCode: e.keyCode});
  }

  if (e.ctrlKey) return;

  switch (e.keyCode) {
    case 13: // Enter
    case 39: // right arrow
    case 40: // down arrow
    case 32: // space
      this.nextSlideStep();
      e.preventDefault();
      break;

    case 34: // PgDn
      this.nextSlide();
      e.preventDefault();
      break;

    case 35: // end
      this.setSlide(this.slides.length - 1);
      break;

    case 37: // left arrow
    case 38: // up arrow
    case 8: // Backspace
    case 33: // PgUp
      this.prevSlide();
      e.preventDefault();
      break;

    case 36: // home
      this.setSlide(0);
      break;

    case 72: // H: Toggle code highlighting
      document.body.classList.toggle('highlight-code');
      break;

    case 79: // O: Toggle overview
      document.body.classList.toggle('overview');
      break;

    case 78: // N
      document.body.classList.toggle('with-notes');
      break;

    case 82: // R
      // TODO: implement refresh on main slides when popup is refreshed.
      break;

    case 27: // ESC: hide notes, close overview
      document.body.classList.remove('with-notes');

      document.body.classList.remove('overview');
      break;

    case 70: // F: Toggle fullscreen
       // Only respect 'f' on body. Don't want to capture keys from an <input>.
       // Also, ignore browser's fullscreen shortcut (cmd+shift+f) so we don't
       // get trapped in fullscreen!
      if (e.target == document.body && !(e.shiftKey && e.metaKey)) {
        if (document.mozFullScreen !== undefined && !document.mozFullScreen) {
          document.body.mozRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        } else if (document.webkitIsFullScreen !== undefined && !document.webkitIsFullScreen) {
          document.body.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        } else {
          document.cancelFullScreen();
        }
      }
      break;
  }
};

/**
 * @param {Event} event
 */
SlideDeck.prototype.onWindowResize_ = function(event) {
  var factor = 1 / Math.max(
        this.container.clientWidth / window.innerWidth,
        this.container.clientHeight / window.innerHeight
      );
  this.container.style.transform = 'scale(' + factor + ')';
}


/**
 * @param {string} The string to convert to Boolean.
 * @private
 */
SlideDeck.prototype.configValueToBool_ = function(value) {
  switch(value.trim().toLowerCase()){
    case "1":
    case "on":
    case "yes":
    case "true":
      return true;
    return false;
  }
}

/**
 * @private
 */
SlideDeck.prototype.loadConfig_ = function() {
  // Store data from tags like
  // ``<meta name="hieroglyph-config-{k} content="{v}">`` into
  // ``settingsFromMetaTags[k] = v``.
  var settingsFromMetaTags = {},
      configMetaTags = document.querySelectorAll(
        'meta[name^="hieroglyph-config-"]'
      );
  for (var i = 0, item; item = configMetaTags[i]; i++) {
    settingsFromMetaTags[
      item.getAttribute("name").replace("hieroglyph-config-", "")
    ] = item.getAttribute("content");
  }

  // If to use builds. Defaults to yes.
  if (settingsFromMetaTags["use-builds"] == undefined ||
      this.configValueToBool_(settingsFromMetaTags["use-builds"])) {
    this.makeBuildLists_();
  }
};

/**
 * @private
 */
SlideDeck.prototype.buildNextBuildItem_ = function() {
  var slide = this.slides[this.curSlide_];
  var toBuild = slide.querySelector('.to-build');
  var built = slide.querySelector('.build-current');

  if (built) {
    built.classList.remove('build-current');
    if (built.classList.contains('fade')) {
      built.classList.add('build-fade');
    }
  }

  if (!toBuild) {
    var items = slide.querySelectorAll('.build-fade');
    for (var j = 0, item; item = items[j]; j++) {
      item.classList.remove('build-fade');
    }
    return false;
  }

  toBuild.classList.remove('to-build');
  toBuild.classList.add('build-current');

  return true;
};

SlideDeck.prototype.buildNextItem_ = function() {

    var slide = this.slides[this.curSlide_];
    var built = slide.querySelectorAll('.build-current');

    var buildItems = slide.querySelectorAll('[class*="build-item-"]');
    var show_items;

    // Remove the classes from the previously built item
    if (built) {
        for (var j = 0, built_item; built_item = built[j]; ++j) {
            built_item.classList.remove('build-current');
            if (built_item.classList.contains('fade')) {
                built_item.classList.add('build-fade');
            }

            if (built_item.getAttribute('data-build-show-only')) {

                if (built_item.getAttribute('data-build-class')) {
                    built_item.classList.remove(
                        built_item.getAttribute('data-build-class')
                    );
                } else {
                    built_item.classList.add('build-hide');
                }
            }
        };
    }

    if (slide._buildItems && slide._buildItems.length) {
        while ((show_items = slide._buildItems.shift()) === undefined) {};
        if (show_items) {

            // show the next items
            show_items.forEach(function(item, index, items) {
                item.classList.remove('to-build');
                item.classList.add('build-current');

                if (item.getAttribute('data-build-class')) {
                    item.classList.add(item.getAttribute('data-build-class'));
                }
            });

            return true;
        }
    }

    return this.buildNextBuildItem_();

};

/**
 * @param {boolean=} opt_dontPush
 */
SlideDeck.prototype.prevSlide = function(opt_dontPush) {
  if (this.curSlide_ > 0) {
    this.setSlide(this.curSlide_ - 1, opt_dontPush);
  }
};

/**
 * @param {boolean=} opt_dontPush
 */
SlideDeck.prototype.nextSlideStep = function(opt_dontPush) {
  if (!document.body.classList.contains('overview') &&
      this.buildNextItem_()) {
    return;
  }
  this.nextSlide(opt_dontPush);
};

/**
 * @param {boolean=} opt_dontPush
 */
SlideDeck.prototype.nextSlide = function(opt_dontPush) {
  if (this.curSlide_ < this.slides.length - 1) {
    this.setSlide(this.curSlide_ + 1, opt_dontPush);
  }
};

/**
 * @param {number} slideNo
 * @param {boolean=} opt_dontPush
 */
SlideDeck.prototype.setSlide = function(slideNo, opt_dontPush) {

  if (0 <= slideNo && slideNo < this.slides.length) {
    var bodyClassList = document.body.classList;
    bodyClassList.remove('highlight-code');

    // Toggle off speaker notes if they're showing when we advanced on the main
    // slides. If we're the speaker notes popup, leave them up.
    if (this.controller && !this.controller.isPopup) {
      bodyClassList.remove('with-notes');
    } else if (!this.controller) {
      bodyClassList.remove('with-notes');
    }

    this.prevSlide_ = this.curSlide_;
    this.curSlide_ = slideNo;

    this.updateSlides_(opt_dontPush);

  } else {
    console.log("Non-existent slide number " + slideNo + " has been " +
                "requested. There is probably a bug somewhere.");
  }
};

/* Slide events */

/**
 * Triggered when a slide enter/leave event should be dispatched.
 *
 * @param {string} type The type of event to trigger
 *     (e.g. 'slideenter', 'slideleave').
 * @param {number} slideNo The index of the slide that is being left.
 */
SlideDeck.prototype.triggerSlideEvent = function(type, slideNo) {
  var el = this.getSlideEl_(slideNo);
  if (!el) {
    return;
  }

  // Call onslideenter/onslideleave if the attribute is defined on this slide.
  var func = el.getAttribute(type);
  if (func) {
    new Function(func).call(el); // TODO: Don't use new Function() :(
  }

  // Dispatch event to listeners setup using addEventListener.
  var evt = document.createEvent('Event');
  evt.initEvent(type, true, true);
  evt.slideNumber = slideNo + 1; // Make it readable
  evt.slide = el;

  el.dispatchEvent(evt);
};

/**
 * @private
 */
SlideDeck.prototype.updateSlides_ = function(opt_dontPush) {
  var dontPush = opt_dontPush || false;

  var curSlide = this.curSlide_;
  for (var i = 0; i < this.slides.length; ++i) {
    switch (i) {
      case curSlide - 2:
        this.updateSlideClass_(i, 'far-past');
        this.disableSlideFrames_(i);
        break;
      case curSlide - 1:
        this.updateSlideClass_(i, 'past');
        // No way to tell when all slide transitions + auto builds are done.
        // Give ourselves a good buffer to preload the next slide's iframes.
        window.setTimeout(this.enableSlideFrames_.bind(this, i), 1000);
        break;
      case curSlide:
        this.updateSlideClass_(i, 'current');
        this.enableSlideFrames_(i);
        break;
      case curSlide + 1:
        this.updateSlideClass_(i, 'next');
        // No way to tell when all slide transitions + auto builds are done.
        // Give ourselves a good buffer to preload the next slide's iframes.
        window.setTimeout(this.enableSlideFrames_.bind(this, i), 1000);
        break;
      case curSlide + 2:
        this.updateSlideClass_(i, 'far-next');
        this.disableSlideFrames_(i);
        break;
      default:
        this.updateSlideClass_(i);
        this.disableSlideFrames_(i);
        break;
    }
  };

  this.triggerSlideEvent('slideleave', this.prevSlide_);
  this.triggerSlideEvent('slideenter', curSlide);

  this.updateHash_(dontPush);
};

/**
 * @private
 * @param {number} slideNo
 */
SlideDeck.prototype.enableSlideFrames_ = function(slideIndex) {
  var el = this.slides[slideIndex];
  if (!el) {
    return;
  }

  var frames = el.querySelectorAll('iframe');
  for (var i = 0, frame; frame = frames[i]; i++) {
    this.enableFrame_(frame);
  }
};

/**
 * @private
 * @param {number} slideNo
 */
SlideDeck.prototype.enableFrame_ = function(frame) {
  var src = frame.dataset.src;
  if (src && frame.src != src) {
    frame.src = src;
  }
};

/**
 * @private
 * @param {number} slideNo
 */
SlideDeck.prototype.disableSlideFrames_ = function(slideIndex) {
  var el = this.slides[slideIndex];
  if (!el) {
    return;
  }

  var frames = el.querySelectorAll('iframe');
  for (var i = 0, frame; frame = frames[i]; i++) {
    this.disableFrame_(frame);
  }
};

/**
 * @private
 * @param {Node} frame
 */
SlideDeck.prototype.disableFrame_ = function(frame) {
  frame.src = 'about:blank';
};

/**
 * @private
 * @param {number} slideNo
 */
SlideDeck.prototype.getSlideEl_ = function(no) {
  if ((no < 0) || (no >= this.slides.length)) {
    return null;
  } else {
    return this.slides[no];
  }
};

/**
 * @private
 * @param {number} slideNo
 * @param {string} className
 */
SlideDeck.prototype.updateSlideClass_ = function(slideNo, className) {
  var el = this.getSlideEl_(slideNo);

  if (!el) {
    return;
  }

  if (className) {
    el.classList.add(className);
  }

  for (var i = 0, slideClass; slideClass = this.SLIDE_CLASSES_[i]; ++i) {
    if (className != slideClass) {
      el.classList.remove(slideClass);
    }
  }
};

/**
 * @private
 */
SlideDeck.prototype.BUILD_ITEM_RE = /build-item-(\d+)(-class-(\w+))?(-only)?/;

SlideDeck.prototype.makeBuildLists_ = function () {
  for (var i = this.curSlide_, slide; slide = this.slides[i]; ++i) {
    var items = slide.querySelectorAll('.build > *');

    for (var j = 0, item; item = items[j]; ++j) {
      if (item.classList) {
        item.classList.add('to-build');
        if (item.parentNode.classList.contains('fade')) {
          item.classList.add('fade');
        }
      }
    }

    var items = slide.querySelectorAll('[class*="build-item-"]');
    if (items.length) {
        slide._buildItems = [];
    };
    for (var j = 0, item; item = items[j]; ++j) {
      if (item.classList) {
        item.classList.add('to-build');
        if (!item.parentNode.classList.contains('build')) {
            item.parentNode.classList.add('build');
        }
        if (item.parentNode.classList.contains('fade')) {
          item.classList.add('fade');
        }
      }

      var build_info = this.BUILD_ITEM_RE.exec(item.classList),
          build_index = build_info[1],
          build_class = build_info[3],
          build_only = build_info[4];

      if (slide._buildItems[build_index] === undefined) {
          slide._buildItems[build_index] = [];
      }
      slide._buildItems[build_index].push(item);

      if (build_class) {
          item.setAttribute('data-build-class', build_class);
      }

      if (build_only) {
          // add the data-attribute
          item.setAttribute('data-build-show-only', build_index);
      }

    }

  }
};

/**
 * @private
 * @param {boolean} dontPush
 */
SlideDeck.prototype.updateHash_ = function(dontPush) {
  if (!dontPush) {
    var slideNo = this.curSlide_ + 1;
    var hash = '#' + slideNo;
    if (window.history.pushState) {
      window.history.pushState(this.curSlide_, 'Slide ' + slideNo, hash);
    } else {
      window.location.replace(hash);
    }

    // Record GA hit on this slide.
    window['_gaq'] && window['_gaq'].push(['_trackPageview',
                                          document.location.href]);
  }
};

SlideDeck.prototype.onPrint_ = function(mediaQueryList) {

  // print view enabled
  if (mediaQueryList.matches) {
    for (var i = 0; i < this.slides.length; ++i) {
      this.enableSlideFrames_(i);
    }

  // print view disabled
  } else {
    this.updateSlides_(true);
  }
};
