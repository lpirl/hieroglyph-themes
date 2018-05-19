(function(window) {

var ORIGIN_ = location.protocol + '//' + location.host;

function SlideController() {
  this.popup = null;
  this.isPopup = window.opener;

  if (this.setupDone()) {
    window.addEventListener('message', this.onMessage_.bind(this), false);

    // Close popups if we reload the main window.
    window.addEventListener('beforeunload', function(e) {
      if (this.popup) {
        this.popup.close();
      }
    }.bind(this), false);
  }
}

SlideController.prototype.openPopup_= function() {
  console.assert(!this.isPopup);
  var opts = 'menubar=no,location=yes,resizable=yes,scrollbars=no,status=no';
  this.popup = window.open(location.href, 'hieroglyph-presenter-view', opts);
}

SlideController.prototype.closePopup_= function() {
  console.assert(!this.isPopup);
  this.popup.close();
  this.popup = null;
}

SlideController.prototype.setPresenterModeState_= function(state) {
  if (this.isPopup) return;
  try {
    localStorage.ENABLE_PRESENTOR_MODE = state;
  } catch (e) {
    if (!(e instanceof DOMException)) {
      throw e;
    }
  }
}

SlideController.prototype.setupDone = function() {

  if (this.isPopup) return;

  var enablePresenterMode = false;
  try {
    enablePresenterMode = localStorage.getItem('ENABLE_PRESENTOR_MODE');
  } catch (e) {
    if (!(e instanceof DOMException)) {
      throw e;
    }
  }

  if (enablePresenterMode && JSON.parse(enablePresenterMode)) {
    this.openPopup_();
  }

  var that = this;
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey) return;
    switch (e.keyCode) {
      case 80: // P
        if (document.hasFocus()) {
          that.openPopup_();
          that.setPresenterModeState_(true);
        } else {
          that.closePopup_();
          that.setPresenterModeState_(false);
        }
        break;
    }
  }, true);

  return true;
}

SlideController.prototype.onMessage_ = function(e) {
  var data = e.data;

  // Restrict messages to being from this origin. Allow local developmet
  // from file:// though.
  // TODO: It would be dope if FF implemented location.origin!
  if (e.origin != ORIGIN_ && ORIGIN_.indexOf('file://') != 0) {
    alert('Someone tried to postMessage from an unknown origin');
    return;
  }

  if ('keyCode' in data) {
    var evt = document.createEvent('Event');
    evt.initEvent('keydown', true, true);
    evt.keyCode = data.keyCode;
    document.dispatchEvent(evt);
  }
};

SlideController.prototype.sendMsg = function(msg) {
  // // Send message to popup window.
  // if (this.popup) {
  //   this.popup.postMessage(msg, ORIGIN_);
  // }

  // Send message to main window.
  if (this.isPopup) {
    // TODO: It would be dope if FF implemented location.origin.
    window.opener.postMessage(msg, '*');
  }
};

window.SlideController = SlideController;

})(window);
