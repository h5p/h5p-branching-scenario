H5P.BranchingScenario.LibraryScreenOverlay = (function () {

  /**
   * LibraryScreenOverlay
   * @constructor
   */
  function LibraryScreenOverlay() {
    this.hidden = true;

    this.overlay = document.createElement('div');
    this.overlay.classList.add('h5p-content-overlay');
    this.overlay.classList.add('h5p-hidden');

    this.buttonsContainer = document.createElement('div');
    this.buttonsContainer.classList.add('h5p-content-overlay-buttonsContainer');
    this.overlay.appendChild(this.buttonsContainer);

    this.buttons = {};

    // Trap focus if overlay is visible
    document.addEventListener('focus', event => {
      if (!this.isVisible() || Object.keys(this.buttons).length === 0) {
        return; // Nothing to trap
      }

      this.trapFocus(event);
    }, true);
  }

  /**
   * Get DOM element of overlay.
   * @return {HTMLElement} DOM element of overlay.
   */
  LibraryScreenOverlay.prototype.getDOM = function () {
    return this.overlay;
  }

  /**
   * Show overlay.
   */
  LibraryScreenOverlay.prototype.show = function () {
    this.overlay.classList.remove('h5p-hidden');
    window.requestAnimationFrame(() => {
      this.buttonsContainer.classList.remove('h5p-hidden');
      this.hidden = false;

      // Focus last button (assuming proceed)
      Object.values(this.buttons)[Object.keys(this.buttons).length - 1].focus();
    });
  }

  /**
   * Hide overlay.
   */
  LibraryScreenOverlay.prototype.hide = function () {
    this.hidden = true;
    this.overlay.classList.add('h5p-hidden');
    this.buttonsContainer.classList.add('h5p-hidden');
  }

  /**
   * Determine whether overlay is visible.
   * @return {boolean} True, if overlay is visible, else false;
   */
  LibraryScreenOverlay.prototype.isVisible = function () {
    return !this.hidden;
  }

  /**
   * Trap keyboard focus in overlay.
   * @param {Event} event Focus event.
   */
  LibraryScreenOverlay.prototype.trapFocus = function (event) {
    if (event.path.indexOf(this.overlay) !== -1) {
      this.currentFocusElement = event.target;
      return; // Focus/event.target is inside overlay
    }

    // Focus was either on first or last overlay element
    if (this.currentFocusElement === Object.values(this.buttons)[0]) {

      this.currentFocusElement = Object.values(this.buttons)[Object.keys(this.buttons).length - 1];
    }
    else {
      this.currentFocusElement = Object.values(this.buttons)[0];
    }
    this.currentFocusElement.focus();
  }

  /**
   * Add button to overlay.
   * @param {string|number} id Id of button.
   * @param {string} label Label for button.
   * @param {function} callback Callback for button click.
   * @return {HTMLElement} Button.
   */
  LibraryScreenOverlay.prototype.addButton = function (id, label, callback) {
    if (
      !id && id !== 0 ||
      !label ||
      typeof callback !== 'function' ||
      this.buttons[id]
    ) {
      return null;
    }

    const button = document.createElement('button');
    button.classList.add('transition');
    button.classList.add('h5p-nav-button');
    button.classList.add(`h5p-nav-button-${id}`);
    button.innerText = label;

    button.addEventListener('click', event => {
      callback(id);
    });

    this.buttons[id] = button;
    this.buttonsContainer.appendChild(button);

    return button;
  }

  /**
   * Remove button.
   * @param {string|number} id Id of button.
   */
  LibraryScreenOverlay.prototype.removeButton = function (id) {
    if (!id && id !== 0 || !this.buttons[id]) {
      return;
    }

    this.buttonsContainer.removeChild(this.buttons[id])
    delete this.buttons[id];
  }

  return LibraryScreenOverlay;
})();
