import { addResizeListener } from 'detect-resize';

H5P.BranchingScenario.LibraryScreen = (function () {

  /**
   * LibraryScreen
   *
   * @param  {BranchingScenario} parent BranchingScenario object
   * @param  {string} courseTitle Title
   * @param  {Object} library H5P Library Data
   * @return {LibraryScreen} A screen oject
   */
  function LibraryScreen(parent, courseTitle, library) {
    const self = this;
    H5P.EventDispatcher.call(this);

    this.parent = parent;
    this.currentLibraryElement;
    this.currentLibraryInstance;
    this.currentLibraryId = 0;
    this.nextLibraryId = library.nextContentId;
    this.libraryFeedback = library.feedback;
    this.nextLibraries = {};
    this.libraryInstances = {};
    this.libraryTitle;
    this.branchingQuestions = [];
    this.navButton;
    this.header;
    this.shouldAutoplay = [];
    this.isShowing = false;

    const contentTitle = (library.type && library.type.metadata && library.type.metadata.title ? library.type.metadata.title : '');
    this.wrapper = this.createWrapper(courseTitle, (contentTitle ? contentTitle : 'Untitled Content'), library.showContentTitle && contentTitle);
    this.wrapper.classList.add('h5p-next-screen');
    this.wrapper.classList.add('h5p-branching-hidden');

    const libraryWrapper = this.createLibraryElement(library, false);
    this.currentLibraryWrapper = libraryWrapper;
    this.currentLibraryElement = libraryWrapper.getElementsByClassName('h5p-branching-scenario-content')[0];
    this.currentLibraryInstance = this.libraryInstances[0]; // TODO: Decide whether the start screen id should be hardcoded as 0

    this.createNextLibraries(library);

    this.wrapper.appendChild(libraryWrapper);

    self.triggerAutoplay = function (e) {
      const id = (e.data !== undefined && e.data.nextContentId !== undefined ? e.data.nextContentId : 0);
      if (id < 0 || id !== self.currentLibraryId) {
        return; // All of the stars did not align, skip autoplay
      }

      const library = parent.getLibrary(id);
      if (library.type.library.split(' ')[0] === 'H5P.BranchingQuestion') {
        return;
      }

      if (self.shouldAutoplay[self.currentLibraryId] && self.currentLibraryInstance.play !== undefined) {
        self.currentLibraryInstance.play();
      }
    };

    parent.on('started', self.triggerAutoplay);
    parent.on('navigated', self.triggerAutoplay);
  }

  /**
   * Creates a wrapping div for the library screen
   *
   * @param  {string} courseTitle Main title
   * @param  {string} libraryTitle Library specific title
   * @return {HTMLElement} Wrapping div
   */
  LibraryScreen.prototype.createWrapper = function (courseTitle, libraryTitle, showLibraryTitle) {
    const wrapper = document.createElement('div');

    const titleDiv = document.createElement('div');
    titleDiv.classList.add('h5p-title-wrapper');

    if (H5P.canHasFullScreen) {
      const fullScreenButton = document.createElement('button');
      fullScreenButton.className = 'h5p-branching-full-screen';
      fullScreenButton.addEventListener('click', () => {
        this.trigger('toggleFullScreen');
      });
      titleDiv.appendChild(fullScreenButton);
    }

    const headers = document.createElement('div');
    headers.className = 'h5p-branching-header';

    const headerTitle = document.createElement('h1');
    headerTitle.innerHTML = courseTitle;
    headers.appendChild(headerTitle);

    const headerSubtitle = document.createElement('h2');
    headerSubtitle.classList.add('library-subtitle');
    headerSubtitle.innerHTML = showLibraryTitle ? libraryTitle : '&nbsp;';
    headerSubtitle.setAttribute('tabindex', '-1');
    headerSubtitle.setAttribute('aria-label', libraryTitle);
    headers.appendChild(headerSubtitle);

    titleDiv.appendChild(headers);

    this.libraryTitle = headerSubtitle;

    const buttonWrapper = document.createElement('div');
    buttonWrapper.classList.add('h5p-nav-button-wrapper');
    const navButton = document.createElement('button');
    navButton.classList.add('transition');

    const self = this;
    const parent = this.parent;
    navButton.onclick = function () {
      // Stop impatient users from breaking the view
      if (parent.navigating === false) {
        const hasFeedbackTitle = self.libraryFeedback.title
          && self.libraryFeedback.title.trim();
        const hasFeedbackSubtitle = self.libraryFeedback.subtitle
          && self.libraryFeedback.subtitle.trim();

        const hasFeedback = !!(hasFeedbackTitle
          || hasFeedbackSubtitle
          || self.libraryFeedback.image
        );

        if (hasFeedback && self.nextLibraryId !== -1) {
          // Add an overlay if it doesn't exist yet
          if (self.overlay === undefined) {
            self.overlay = document.createElement('div');
            self.overlay.className = 'h5p-branching-scenario-overlay';
            self.wrapper.appendChild(self.overlay);
            self.hideBackgroundFromReadspeaker();
          }

          const branchingQuestion = document.createElement('div');
          branchingQuestion.classList.add('h5p-branching-question-wrapper');
          branchingQuestion.classList.add('h5p-branching-scenario-feedback-dialog');


          var questionContainer = document.createElement('div');
          questionContainer.classList.add('h5p-branching-question-container');

          branchingQuestion.appendChild(questionContainer);

          const feedbackScreen = self.createFeedbackScreen(self.libraryFeedback, self.nextLibraryId);
          questionContainer.appendChild(feedbackScreen);

          questionContainer.classList.add('h5p-start-outside');
          questionContainer.classList.add('h5p-fly-in');
          self.currentLibraryWrapper.style.zIndex = 0;
          self.wrapper.appendChild(branchingQuestion);
          feedbackScreen.focus();
        }
        else {
          const nextScreen = {
            nextContentId: self.nextLibraryId
          };

          if (!!(hasFeedback || (self.libraryFeedback.endScreenScore !== undefined))) {
            nextScreen.feedback = self.libraryFeedback;
          }
          parent.trigger('navigated', nextScreen);
        }

        parent.navigating = true;
      }
    };
    navButton.classList.add('h5p-nav-button');

    this.navButton = navButton;

    navButton.appendChild(document.createTextNode(parent.params.l10n.proceedButtonText));
    buttonWrapper.appendChild(navButton);

    const header = document.createElement('div');
    header.classList.add('h5p-screen-header');

    this.header = header;

    header.appendChild(titleDiv);
    header.appendChild(buttonWrapper);
    wrapper.appendChild(header);

    const handleWrapperResize = () => {
      if (self.wrapper.clientHeight > 500) {
        self.wrapper.style.minHeight = self.wrapper.clientHeight + 'px';
      }
    };

    addResizeListener(wrapper, handleWrapperResize);

    // Resize container on animation end
    wrapper.addEventListener("animationend", function (event) {
      if (event.animationName === 'slide-in' && self.currentLibraryElement) {
        parent.trigger('resize');

        const handleLibraryResize = () => {
          // Fullscreen always use the full height available to it
          if (parent.isFullScreen()) {
            self.currentLibraryWrapper.style.height = '';
            self.wrapper.style.minHeight = '';
            parent.trigger('resize');
            return;
          }

          self.currentLibraryWrapper.style.height = self.currentLibraryElement.clientHeight + 40 + 'px';
          // NOTE: This is a brittle hardcoding of the header height
          self.wrapper.style.minHeight = self.currentLibraryElement.clientHeight + 40 + 70.17 + 'px';
          parent.trigger('resize');
        };

        setTimeout(() => {
          // Make the library resize then make the wrapper resize to the new library height
          addResizeListener(self.currentLibraryElement, handleLibraryResize);
        }, 100);
      }
    });

    return wrapper;
  };

  LibraryScreen.prototype.createFeedbackScreen = function (feedback, nextContentId) {
    const self = this;
    const labelId = 'h5p-branching-feedback-title-' + LibraryScreen.idCounter++;
    var wrapper = document.createElement('div');
    wrapper.classList.add('h5p-branching-question');
    wrapper.classList.add(feedback.image !== undefined ? 'h5p-feedback-has-image' : 'h5p-feedback-default');
    wrapper.setAttribute('role', 'dialog');
    wrapper.setAttribute('tabindex', '-1');
    wrapper.setAttribute('aria-labelledby', labelId);

    if (feedback.image !== undefined && feedback.image.path !== undefined) {
      var imageContainer = document.createElement('div');
      imageContainer.classList.add('h5p-branching-question');
      imageContainer.classList.add('h5p-feedback-image');
      var image = document.createElement('img');
      image.src = H5P.getPath(feedback.image.path, self.parent.contentId);
      imageContainer.appendChild(image);
      wrapper.appendChild(imageContainer);
    }

    var feedbackContent = document.createElement('div');
    feedbackContent.classList.add('h5p-branching-question');
    feedbackContent.classList.add('h5p-feedback-content');

    var feedbackText = document.createElement('div');
    feedbackText.classList.add('h5p-feedback-content-content');
    feedbackContent.appendChild(feedbackText);

    var title = document.createElement('h1');
    title.id = labelId;
    title.innerHTML = feedback.title || '';
    feedbackText.appendChild(title);

    if (feedback.subtitle) {
      var subtitle = document.createElement('div');
      subtitle.innerHTML = feedback.subtitle || '';
      feedbackText.appendChild(subtitle);
    }

    var navButton = document.createElement('button');
    navButton.onclick = function () {
      self.parent.trigger('navigated', {
        nextContentId
      });
    };

    var text = document.createTextNode(this.parent.params.l10n.proceedButtonText);
    navButton.appendChild(text);

    feedbackContent.appendChild(navButton);

    var KEYCODE_TAB = 9;
    feedbackContent.addEventListener('keydown', function (e) {
      var isTabPressed = (e.key === 'Tab' || e.keyCode === KEYCODE_TAB);
      if (isTabPressed) {
        e.preventDefault();
        return;
      }
    });

    wrapper.appendChild(feedbackContent);

    return wrapper;
  };

  /**
   * Creates the library element and hides it if necessary
   *
   * @param  {Object} library Library object
   * @param  {boolean} isNextLibrary Determines if the lirbary should be hidden for now
   * @return {HTMLElement} Wrapping div for the library element
   */
  LibraryScreen.prototype.createLibraryElement = function (library, isNextLibrary) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('h5p-library-wrapper');

    const libraryElement = document.createElement('div');
    libraryElement.classList.add('h5p-branching-scenario-content');
    this.appendRunnable(libraryElement, library.type, library.contentId);

    wrapper.appendChild(libraryElement);

    if (isNextLibrary) {
      wrapper.classList.add('h5p-next');
      libraryElement.classList.add('h5p-branching-hidden');
    }

    // Special case when first node is BQ and library screen tries to display it
    if (library.type && library.type.library.split(' ')[0] === 'H5P.BranchingQuestion') {
      libraryElement.classList.add('h5p-branching-hidden');
    }

    return wrapper;
  };

  /**
   * Creates a new content instance from the given content parameters and
   * then attaches it the wrapper. Sets up event listeners.
   *
   * @param {Object} container Container the library should be appended to
   * @param {Object} content Data for the library
   * @param {number} id Id of the library
   * @return {undefined}
   */
  LibraryScreen.prototype.appendRunnable = function (container, content, id) {
    const self = this;
    const parent = this.parent;

    const library = content.library.split(' ')[0];
    if (library === 'H5P.Video') {
      // Prevent video from growing endlessly since height is unlimited.
      content.params.visuals.fit = false;
    }
    if (library === 'H5P.BranchingQuestion') {
      content.params.proceedButtonText = parent.params.l10n.proceedButtonText;
    }

    const contentClone = H5P.jQuery.extend(true, {}, content);
    if (hasAutoplay(contentClone.params)) {
      this.shouldAutoplay[id] = true;
    }

    // Create content instance
    // Deep clone paramters to prevent modification (since they're reused each time the course is reset)
    const instance = H5P.newRunnable(
      contentClone,
      this.parent.contentId,
      H5P.jQuery(container),
      true,
      {
        parent: this.parent,
      }
    );
    instance.setActivityStarted();

    // Proceed to Branching Question automatically after video has ended
    if (content.library.indexOf('H5P.Video ') === 0 && this.nextIsBranching(id)) {
      instance.on('stateChange', function (event) {
        if (event.data === H5P.Video.ENDED && self.navButton) {
          self.navButton.click();
        }
      });
    }

    instance.on('navigated', function (e) {
      parent.trigger('navigated', e.data);
    });

    this.libraryInstances[id] = instance;

    // Bubble resize events
    this.bubbleUp(instance, 'resize', parent);

    // Remove any fullscreen buttons
    this.disableFullscreen(instance);
  };

  /**
   * Used to get XAPI data for "previous" library.
   *
   * @param {number} id Id of the instance node
   * @return {Object} XAPI Data
   */
  LibraryScreen.prototype.getXAPIData = function (id) {
    if (this.libraryInstances[id] && this.libraryInstances[id].getXAPIData) {
      return this.libraryInstances[id].getXAPIData();
    }
  };

  /**
   * Check if next node is a Branching Question.
   *
   * @param {number} id Id of node to check for.
   * @return {boolean} True, if next node is BQ, else false.
   */
  LibraryScreen.prototype.nextIsBranching = function (id) {
    const nextContentId = (id !== undefined) ? this.parent.params.content[id].nextContentId : undefined;

    return (nextContentId !== undefined && nextContentId > 0) ?
      LibraryScreen.isBranching(this.parent.params.content[nextContentId]) :
      false;
  };

  /**
   * Check if params has autoplay enabled
   *
   * @param {Object} params
   * @return {boolean}
   */
  const hasAutoplay = function (params) {
    if (params.autoplay) {
      params.autoplay = false;
      return true;
    }
    else if (params.playback && params.playback.autoplay) {
      params.playback.autoplay = false;
      return true;
    }
    else if (params.media && params.media.params &&
             params.media.params.playback &&
             params.media.params.playback.autoplay) {
      params.media.params.playback.autoplay = false;
      return true;
    }
    else if (params.media && params.media.params &&
             params.media.params.autoplay) {
      params.media.params.autoplay = false;
      return true;
    }
    return false;
  };

  /**
   * Pre-render the next libraries for smooth transitions for a specific library
   * @param  {Object} library Library Data
   * @return {undefined}
   */
  LibraryScreen.prototype.createNextLibraries = function (library) {
    this.removeNextLibraries();
    this.nextLibraries = {};
    this.loadLibrary(library);
  };

  /**
   * Create next library
   * @param {Object} library
   */
  LibraryScreen.prototype.createNextLibrary = function (library) {
    this.removeNextLibraries();
    this.nextLibraries = {};
    this.loadLibrary(library, library.contentId);
  };

  /**
   * Load library
   *
   * @param {Object} library
   * @param {number} [contentId] Id of loaded library
   */
  LibraryScreen.prototype.loadLibrary = function (library, contentId = null) {
    const loadedContentId = contentId !== null ? contentId : library.nextContentId;

    // If not a branching question, just load the next library
    if (library.type.library.split(' ')[0] !== 'H5P.BranchingQuestion') {
      const nextLibrary = this.parent.getLibrary(loadedContentId);

      // Do nothing if the next screen is an end screen
      if (nextLibrary === false) {
        return;
      }

      // Pre-render the next library if it is not a branching question
      if (nextLibrary.type && nextLibrary.type.library.split(' ')[0] !== 'H5P.BranchingQuestion') {
        this.nextLibraries[loadedContentId] = this.createLibraryElement(nextLibrary, true);
        this.wrapper.appendChild(this.nextLibraries[loadedContentId]);
      }
    }

    // If it is a branching question, load all the possible libraries
    else {
      const alternatives = library.type.params.branchingQuestion.alternatives || [];
      const ids = alternatives.map(alternative => alternative.nextContentId);
      ids.forEach(nextContentId => {
        const nextLibrary = this.parent.getLibrary(nextContentId);

        // Do nothing if the next screen is an end screen
        if (nextLibrary === false) {
          return;
        }

        // Pre-render all the next libraries as long as they are not branching questions
        if (nextLibrary.type && nextLibrary.type.library.split(' ')[0] !== 'H5P.BranchingQuestion') {
          this.nextLibraries[nextContentId] = this.createLibraryElement(nextLibrary, true);
          this.wrapper.appendChild(this.nextLibraries[nextContentId]);
        }
      });
    }
  };

  /**
   * Remove next libraries
   */
  LibraryScreen.prototype.removeNextLibraries = function () {
    // Remove outdated 'next' libraries
    let nextLibraryElements = this.wrapper.getElementsByClassName('h5p-next');
    for (let i = 0; i < nextLibraryElements.length; i++) {
      nextLibraryElements[i].parentNode.removeChild(nextLibraryElements[i]);
    }
  }

  /**
   * Remove custom fullscreen buttons from sub content.
   * (A bit of a hack, there should have been some sort of override…)
   *
   * @param {Object} instance Library instance
   * @return {undefined}
   */
  LibraryScreen.prototype.disableFullscreen = function (instance) {
    switch (instance.libraryInfo.machineName) {
      case 'H5P.CoursePresentation':
        if (instance.$fullScreenButton) {
          instance.$fullScreenButton.remove();
        }
        break;

      case 'H5P.InteractiveVideo':
        instance.on('controls', function () {
          if (instance.controls.$fullscreen) {
            instance.controls.$fullscreen.remove();
          }
        });
        break;
    }
  };

  /**
   * Makes it easy to bubble events from child to parent
   *
   * @private
   * @param {Object} origin Origin of the Event
   * @param {string} eventName Name of the Event
   * @param {Object} target Target to trigger event on
   * @return {undefined}
   */
  LibraryScreen.prototype.bubbleUp = function (origin, eventName, target) {
    origin.on(eventName, function (event) {
      // Prevent target from sending event back down
      target.bubblingUpwards = true;
      target.trigger(eventName, event);

      // Reset
      target.bubblingUpwards = false;
    });
  };

  /**
   * Slides the screen in and styles it as the current screen
   * @return {undefined}
   */
  LibraryScreen.prototype.show = function () {
    const self = this;
    self.isShowing = true;
    self.wrapper.classList.add('h5p-slide-in');
    self.wrapper.classList.remove('h5p-branching-hidden');

    // Style as the current screen
    self.wrapper.addEventListener('animationend', function (e) {
      if (e.target.className === 'h5p-next-screen h5p-slide-in') {
        self.wrapper.classList.remove('h5p-next-screen');
        self.wrapper.classList.remove('h5p-slide-in');
        self.wrapper.classList.add('h5p-current-screen');
        self.parent.navigating = false;
        self.wrapper.style.minHeight = self.parent.currentHeight;
        self.libraryTitle.focus();
      }
    });
  };

  /**
   * Slides the screen out and styles it to be hidden
   * @param {boolean} skipAnimationListener Skips waiting for animation before removing
   *  elements. Useful when animation would not have time to run anyway.
   * @return {undefined}
   */
  LibraryScreen.prototype.hide = function (skipAnimationListener) {
    const self = this;
    self.isShowing = false;

    // Remove possible alternative libaries
    for (let i = 0; i < this.nextLibraries.length; i++) {
      // Ensures it is hidden if remove() doesn't execute quickly enough
      this.nextLibraries[i].style.display = 'none';
      if (this.nextLibraries[i].parentNode !== null) {
        this.nextLibraries[i].parentNode.removeChild(this.nextLibraries[i]);
      }
    }

    // Hide overlay and branching questions
    if (this.overlay) {
      if (this.overlay.parentNode !== null) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      // TODO: Does not appear to ever run...
      this.overlay = undefined;
      this.branchingQuestions.forEach(bq => {
        if (bq.parentNode !== null) {
          bq.parentNode.removeChild(bq);
        }
      });
    }

    self.wrapper.classList.add('h5p-slide-out');

    function removeElements() {
      self.wrapper.classList.remove('h5p-current-screen');
      self.wrapper.classList.add('h5p-next-screen');
      self.wrapper.classList.remove('h5p-slide-out');
      setTimeout(() => {
        if (self.wrapper.parentNode !== null) {
          self.wrapper.parentNode.removeChild(self.wrapper);
          self.remove();
          self.parent.libraryScreen = null;
          self.parent.trigger('resize');
        }
      }, 100);
    }

    if (skipAnimationListener) {
      setTimeout(() => {
        removeElements();
      }, 800);
    }
    else {
      self.wrapper.addEventListener('animationend', removeElements);
    }
  };

  /**
   * Hides branching question if the next library 'branched to'
   * is the one beneath the overlay. Basically the same as the
   * 'showNextLibrary' function but without transitions
   *
   * @param  {Object} library library data of the library beneath the overlay
   * @return {undefined}
   */
  LibraryScreen.prototype.hideBranchingQuestion = function (library) {
    // TODO: When does this code every run?!
    this.nextLibraryId = library.nextContentId;
    this.libraryFeedback = library.feedback;

    // Hide branching question
    if (this.overlay.parentNode !== null) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = undefined;
    this.branchingQuestions.forEach(bq => {
      if (bq.parentNode !== null) {
        bq.parentNode.removeChild(bq);
      }
    });

    // Prepare next libraries
    this.createNextLibraries(library);
    this.parent.navigating = false;
    this.navButton.focus();
    this.showBackgroundToReadspeaker();
  };

  LibraryScreen.prototype.hideFeedbackDialogs = function () {
    if (this.overlay) {
      if (this.overlay.parentNode !== null) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      this.overlay = undefined;
      this.showBackgroundToReadspeaker();
    }

    const wrapper = document.querySelector('.h5p-current-screen');
    if (!wrapper) {
      return;
    }
    const questionWrapper = wrapper.querySelector('.h5p-branching-question-wrapper');
    if (questionWrapper) {
      questionWrapper.parentNode.removeChild(questionWrapper);
    }
  };

  /**
   * Slides in the next library which may be either a 'normal content type' or a
   * branching question
   *
   * @param  {Object} library Library data
   * @return {undefined}
   */
  LibraryScreen.prototype.showNextLibrary = function (library) {
    this.nextLibraryId = library.nextContentId;
    this.libraryFeedback = library.feedback;

    // Show normal h5p library
    if (library.type.library.split(' ')[0] !== 'H5P.BranchingQuestion') {
      // Update the title
      const contentTitle = (library.type && library.type.metadata && library.type.metadata.title ? library.type.metadata.title : '');
      this.libraryTitle.setAttribute('aria-label', contentTitle ? contentTitle : 'Untitled Content');
      this.libraryTitle.innerHTML = (library.showContentTitle && contentTitle ? contentTitle : '&nbsp;');

      // Slide out the current library
      this.currentLibraryWrapper.classList.add('h5p-slide-out');

      // Remove the branching questions if they exist
      if (this.overlay) {
        // TODO: When does this code every run?!
        if (this.overlay.parentNode !== null) {
          this.overlay.parentNode.removeChild(this.overlay);
        }
        this.overlay = undefined;
        this.branchingQuestions.forEach(bq => {
          if (bq.parentNode !== null) {
            bq.parentNode.removeChild(bq);
          }
        });
        this.showBackgroundToReadspeaker();
      }


      // Initialize library if necessary
      if (!this.nextLibraries[library.contentId]) {
        this.createNextLibrary(library);
      }

      // Slide in selected library
      const libraryWrapper = this.nextLibraries[library.contentId];
      if (!libraryWrapper.offsetParent) {
        this.wrapper.appendChild(libraryWrapper);
      }
      libraryWrapper.classList.add('h5p-slide-in');
      const libraryElement = libraryWrapper.getElementsByClassName('h5p-branching-scenario-content')[0];
      libraryElement.classList.remove('h5p-branching-hidden');

      this.currentLibraryId = library.contentId;
      this.currentLibraryInstance = this.libraryInstances[library.contentId];
      if (this.currentLibraryInstance.resize) {
        this.currentLibraryInstance.resize();
      }

      const self = this;
      this.currentLibraryWrapper.addEventListener('animationend', function () {
        if (self.currentLibraryWrapper.parentNode !== null) {
          self.currentLibraryWrapper.parentNode.removeChild(self.currentLibraryWrapper);
        }
        self.currentLibraryWrapper = libraryWrapper;
        self.currentLibraryWrapper.classList.remove('h5p-next');
        self.currentLibraryWrapper.classList.remove('h5p-slide-in');
        self.currentLibraryElement = libraryWrapper.getElementsByClassName('h5p-branching-scenario-content')[0]; // TODO: Why no use 'libraryElement' ?
        self.createNextLibraries(library);
        self.parent.navigating = false;
        self.libraryTitle.focus();
      });
      this.resize(new H5P.Event('resize', {
        element: libraryElement
      }));
    }
    else { // Show a branching question

      // Remove existing branching questions
      this.branchingQuestions.forEach(bq => {
        if (bq.parentNode !== null) {
          bq.parentNode.removeChild(bq);
        }
      });

      // BS could be showing start screen or library screen
      const wrapper = document.querySelector('.h5p-current-screen');

      // Add an overlay if it doesn't exist yet
      if (this.overlay === undefined) {
        this.overlay = document.createElement('div');
        this.overlay.className = 'h5p-branching-scenario-overlay';
        wrapper.appendChild(this.overlay);
        this.hideBackgroundFromReadspeaker();
      }

      const branchingQuestion = document.createElement('div');
      branchingQuestion.className = 'h5p-branching-question-wrapper';

      this.appendRunnable(branchingQuestion, library.type, library.contentId);
      wrapper.appendChild(branchingQuestion);
      this.branchingQuestions.push(branchingQuestion);

      const labelId = 'h5p-branching-question-title-' + LibraryScreen.idCounter++;
      const questionContainer = branchingQuestion.querySelector('.h5p-branching-question-container');
      questionContainer.setAttribute('role', 'dialog');
      questionContainer.setAttribute('tabindex', '-1');
      questionContainer.setAttribute('aria-labelledby', labelId);
      questionContainer.classList.add('h5p-start-outside');
      questionContainer.classList.add('h5p-fly-in');
      branchingQuestion.querySelector('.h5p-branching-question-title').id = labelId;

      this.currentLibraryWrapper.style.zIndex = 0;

      // Resize if Branching Question contains many alternatives/much text
      if (parseInt(this.currentLibraryWrapper.style.height) < questionContainer.offsetHeight) {
        this.currentLibraryWrapper.style.height = questionContainer.offsetHeight + 'px';
      }

      this.createNextLibraries(library);
      this.parent.navigating = false;

      branchingQuestion.addEventListener('animationend', function () {
        const firstAlternative = branchingQuestion.querySelectorAll('.h5p-branching-question-alternative')[0];
        if (typeof firstAlternative !== 'undefined') {
          questionContainer.focus();
        }
      });
    }
  };

  LibraryScreen.prototype.hideBackgroundFromReadspeaker = function () {
    this.header.setAttribute('aria-hidden', 'true');
    this.currentLibraryWrapper.setAttribute('aria-hidden', 'true');
  };

  LibraryScreen.prototype.showBackgroundToReadspeaker = function () {
    this.header.setAttribute('aria-hidden', 'false');
    this.currentLibraryWrapper.setAttribute('aria-hidden', 'false');
  };

  LibraryScreen.prototype.getElement = function () {
    return this.wrapper;
  };

  LibraryScreen.prototype.remove = function () {
    this.parent.off('started', this.triggerAutoplay);
    this.parent.off('navigated', this.triggerAutoplay);
    if (this.wrapper.parentNode !== null) {
      this.wrapper.parentNode.removeChild(this.wrapper);
    }
  };

  LibraryScreen.prototype.resize = function (e) {
    const instance = this.currentLibraryInstance;
    const element = (e && e.data && e.data.element ? e.data.element : this.currentLibraryElement);

    const isImage = (instance && instance.libraryInfo.machineName === 'H5P.Image');
    const isCP = (instance && instance.libraryInfo.machineName === 'H5P.CoursePresentation');
    const isHotspots = (instance && instance.libraryInfo.machineName === 'H5P.ImageHotspots');
    const isVideo = (instance && instance.libraryInfo.machineName === 'H5P.Video');
    const hasSize = (instance && instance.width && instance.height);

    const canScaleImage = ((hasSize && (isImage || isCP)) || isHotspots || isVideo);
    if (canScaleImage) {
      // Always reset scaling
      element.style.width = '';
      element.style.height = '';

      if (isHotspots) {
        element.style.maxWidth = '';
      }
    }

    // Toggle full screen class for content (required for IV to resize properly)
    if (this.parent.isFullScreen()) {
      element.classList.add('h5p-fullscreen');

      // Preserve aspect ratio for Image in fullscreen (since height is limited) instead of scrolling or streching
      if (canScaleImage) {
        const videoRect = (isVideo ? element.firstChild.getBoundingClientRect() : null);
        const height = isHotspots ? instance.options.image.height : (isVideo ? videoRect.height : instance.height);
        const width = isHotspots ? instance.options.image.width : (isCP ? instance.ratio * height : (isVideo ? videoRect.width : instance.width));
        const aspectRatio = (height / width);

        const availableSpace = element.getBoundingClientRect();
        const availableAspectRatio = (availableSpace.height / availableSpace.width);

        if (aspectRatio > availableAspectRatio) {
          if (isHotspots) {
            element.style.maxWidth = (availableSpace.height * (width / height)) + 'px';
          }
          else {
            element.style.width = (availableSpace.height * (width / height)) + 'px';
          }
        }
        else {
          element.style.height = (availableSpace.width * aspectRatio) + 'px';
        }
      }
    }
    else {
      element.classList.remove('h5p-fullscreen');
    }

    if (instance) {
      instance.trigger('resize', e);
    }
  };

  /**
   * Check if library is a Branching Question
   *
   * @param {Object} library
   * @returns {boolean} True if library is a Branching Question
   */
  LibraryScreen.isBranching = function (library) {
    return library.type.library.indexOf('H5P.BranchingQuestion ') === 0;
  };

  LibraryScreen.idCounter = 0;

  return LibraryScreen;
})();
