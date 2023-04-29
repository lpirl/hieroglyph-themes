/**
 * Make the mouse pointer look a bit like a laser pointer.
 * Code quality "make it work", improvements welcome.
 *
 * @authors Lukas Pirl
 */

(function(window) {

  var timeout = 3000;
  var color = 'rgba(255, 0, 0, 1)';
  var size = 1;
  var size_unit = 'vw';
  var pointer = document.createElement('div');
  pointer.style.position = 'fixed';
  pointer.style.top = - 2 * size + size_unit;
  pointer.style.left = pointer.style.top;
  pointer.style.width = size + size_unit;
  pointer.style.height = pointer.style.width;
  pointer.style.marginLeft = '-' + size / 2 + size_unit;
  pointer.style.marginTop = pointer.style.marginLeft;
  pointer.style.backgroundColor = color;
  pointer.style.borderRadius = '50%';
  pointer.style.zIndex = 1000000;
  pointer.style.transition = 'none';

  /* enables click (also selecting text) "through" red dot cursor */
  pointer.style.pointerEvents = "none";

  var parent = document.querySelector('body:not(.popup)')
  parent.appendChild(pointer);
  parent.style.cursor = "none";

  document.querySelectorAll("object").forEach(e => {
    e.style.pointerEvents = "none";
  });

  var mouseTimer = null;
  function onMouseMove(e){
      if (mouseTimer) {
          window.clearTimeout(mouseTimer);
      } else {
          pointer.style.display = 'initial';
      }
      pointer.style.top = e.clientY + "px";
      pointer.style.left = e.clientX + "px";
      mouseTimer = window.setTimeout(function() {
          pointer.style.display = 'none';
          mouseTimer = null;
      }
      , timeout);
  };
  document.addEventListener('mousemove', onMouseMove);


})(window);
