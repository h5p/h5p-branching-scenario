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

    this.wrapper = library.showContentTitle && library.type && library.type.metadata && library.type.metadata.title ? this.createWrapper(courseTitle, library.type.metadata.title) : this.createWrapper(courseTitle);
    this.wrapper.classList.add('h5p-next-screen');
    this.wrapper.classList.add('h5p-branching-hidden');

    const libraryWrapper = this.createLibraryElement(library, false);
    this.currentLibraryWrapper = libraryWrapper;
    this.currentLibraryElement = libraryWrapper.getElementsByClassName('h5p-branching-scenario-content')[0];
    this.currentLibraryInstance = this.libraryInstances[0]; // TODO: Decide whether the start screen id should be hardcoded as 0

    this.createNextLibraries(library);

    this.wrapper.append(libraryWrapper);
  }

  /**
   * Creates a wrapping div for the library screen
   *
   * @param  {string} courseTitle Main title
   * @param  {string} libraryTitle Library specific title
   * @return {HTMLElement} Wrapping div
   */
  LibraryScreen.prototype.createWrapper = function (courseTitle, libraryTitle) {
    const wrapper = document.createElement('div');

    const titleDiv = document.createElement('div');
    titleDiv.classList.add('h5p-title-wrapper');

    const fullScreenButton = document.createElement('button');
    fullScreenButton.className = 'h5p-branching-full-screen';
    fullScreenButton.addEventListener('click', () => {
      this.trigger('toggleFullScreen');
    });
    titleDiv.append(fullScreenButton);

    const headers = document.createElement('div');
    headers.className = 'h5p-branching-header';

    const headerTitle = document.createElement('h1');
    headerTitle.innerHTML = courseTitle;
    headers.append(headerTitle);

    const headerSubtitle = document.createElement('h2');
    headerSubtitle.classList.add('library-subtitle');
    headerSubtitle.innerHTML = libraryTitle ? libraryTitle : '';
    headers.append(headerSubtitle);

    titleDiv.append(headers);

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
        const hasFeedback = !!(self.libraryFeedback.title
          || self.libraryFeedback.subtitle
          || self.libraryFeedback.image
        );

        if (hasFeedback && self.nextLibraryId !== -1) {
          // Add an overlay if it doesn't exist yet
          if (self.overlay === undefined) {
            self.overlay = document.createElement('div');
            self.overlay.className = 'h5p-branching-scenario-overlay';
            self.wrapper.append(self.overlay);
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
          self.wrapper.append(branchingQuestion);
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

    navButton.append(document.createTextNode(parent.params.l10n.proceedButtonText));
    buttonWrapper.append(navButton);

    const header = document.createElement('div');
    header.classList.add('h5p-screen-header');

    this.header = header;

    header.append(titleDiv);
    header.append(buttonWrapper);
    wrapper.append(header);

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
    var wrapper = document.createElement('div');
    wrapper.classList.add('h5p-branching-question');
    wrapper.classList.add(feedback.image !== undefined ? 'h5p-feedback-has-image' : 'h5p-feedback-default');

    if (feedback.image !== undefined && feedback.image.path !== undefined) {
      var imageContainer = document.createElement('div');
      imageContainer.classList.add('h5p-branching-question');
      imageContainer.classList.add('h5p-feedback-image');
      var image = document.createElement('img');
      image.src = H5P.getPath(feedback.image.path, self.parent.contentId);
      imageContainer.append(image);
      wrapper.append(imageContainer);
    }

    var feedbackContent = document.createElement('div');
    feedbackContent.classList.add('h5p-branching-question');
    feedbackContent.classList.add('h5p-feedback-content');

    var title = document.createElement('h1');
    title.innerHTML = feedback.title || '';
    feedbackContent.append(title);

    if (feedback.subtitle) {
      var subtitle = document.createElement('h2');
      subtitle.innerHTML = feedback.subtitle || '';
      feedbackContent.append(subtitle);
    }

    var navButton = document.createElement('button');
    navButton.onclick = function () {
      self.parent.trigger('navigated', {
        nextContentId
      });
    };

    var text = document.createTextNode(this.parent.params.l10n.proceedButtonText);
    navButton.append(text);

    feedbackContent.append(navButton);

    var KEYCODE_TAB = 9;
    feedbackContent.addEventListener('keydown', function (e) {
      var isTabPressed = (e.key === 'Tab' || e.keyCode === KEYCODE_TAB);
      if (isTabPressed) {
        e.preventDefault();
        return;
      }
    });

    wrapper.append(feedbackContent);

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

    wrapper.append(libraryElement);

    if (isNextLibrary) {
      wrapper.classList.add('h5p-next');
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
    const parent = this.parent;

    const library = content.library.split(' ')[0];
    if (library === 'H5P.Video') {
      // Prevent video from growing endlessly since height is unlimited.
      content.params.visuals.fit = false;
    }
    if (library === 'H5P.BranchingQuestion') {
      content.params.proceedButtonText = parent.params.l10n.proceedButtonText;
    }

    // Create content instance
    const instance = H5P.newRunnable(content, this.parent.contentId, H5P.jQuery(container), true);

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
   * Pre-render the next libraries for smooth transitions for a specific library
   * @param  {Object} library Library Data
   * @return {undefined}
   */
  LibraryScreen.prototype.createNextLibraries = function (library) {

    // Remove outdated 'next' libraries
    let nextLibraryElements = this.wrapper.getElementsByClassName('h5p-next');
    for (let i = 0; i < nextLibraryElements.length; i++) {
      nextLibraryElements[i].remove();
    }

    this.nextLibraries = {};

    // If not a branching question, just load the next library
    if (library.type.library.split(' ')[0] !== 'H5P.BranchingQuestion') {
      const nextLibrary = this.parent.getLibrary(library.nextContentId);

      // Do nothing if the next screen is an end screen
      if (nextLibrary === false) {
        return;
      }

      // Pre-render the next library if it is not a branching question
      if (nextLibrary.type && nextLibrary.type.library.split(' ')[0] !== 'H5P.BranchingQuestion') {
        this.nextLibraries[library.nextContentId] = this.createLibraryElement(nextLibrary, true);
        this.wrapper.append(this.nextLibraries[library.nextContentId]);
      }
    }

    // If it is a branching question, load all the possible libraries
    else {
      const ids = library.type.params.branchingQuestion.alternatives.map(alternative => alternative.nextContentId);
      ids.forEach(nextContentId => {
        const nextLibrary = this.parent.getLibrary(nextContentId);

        // Do nothing if the next screen is an end screen
        if (nextLibrary === false) {
          return;
        }

        // Pre-render all the next libraries as long as they are not branching questions
        if (nextLibrary.type && nextLibrary.type.library.split(' ')[0] !== 'H5P.BranchingQuestion') {
          this.nextLibraries[nextContentId] = this.createLibraryElement(nextLibrary, true);
          this.wrapper.append(this.nextLibraries[nextContentId]);
        }
      });
    }
  };

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
        self.navButton.focus();
      }
    });
  };

  /**
   * Slides the screen out and styles it to be hidden
   * @return {undefined}
   */
  LibraryScreen.prototype.hide = function () {
    const self = this;

    // Remove possible alternative libaries
    for (let i = 0; i < this.nextLibraries.length; i++) {
      // Ensures it is hidden if remove() doesn't execute quickly enough
      this.nextLibraries[i].style.display = 'none';
      this.nextLibraries[i].remove();
    }

    // Hide overlay and branching questions
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = undefined;
      this.branchingQuestions.forEach(bq => bq.remove());
    }

    self.wrapper.classList.add('h5p-slide-out');

    self.wrapper.addEventListener('animationend', function () {
      self.wrapper.classList.remove('h5p-current-screen');
      self.wrapper.classList.add('h5p-next-screen');
      self.wrapper.classList.remove('h5p-slide-out');
      setTimeout(() => self.wrapper.remove(), 100);
    });
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
    this.nextLibraryId = library.nextContentId;
    this.libraryFeedback = library.feedback;

    // Hide branching question
    this.overlay.remove();
    this.overlay = undefined;
    this.branchingQuestions.forEach(bq => bq.remove());

    // Prepare next libraries
    this.createNextLibraries(library);
    this.parent.navigating = false;
    this.navButton.focus();
    this.showBackgroundToReadspeaker();
  };

  LibraryScreen.prototype.hideFeedbackDialogs = function () {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = undefined;
    }

    const questionWrapper = this.wrapper.querySelector('.h5p-branching-question-wrapper');
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
      if (library.showContentTitle) {
        this.libraryTitle.innerHTML = library.type && library.type.metadata && library.type.metadata.title ? library.type.metadata.title : '';
      }

      // Slide out the current library
      this.currentLibraryWrapper.classList.add('h5p-slide-out');

      // Remove the branching questions if they exist
      if (this.overlay) {
        this.overlay.remove();
        this.overlay = undefined;
        this.branchingQuestions.forEach(bq => bq.remove());
        this.showBackgroundToReadspeaker();
      }

      // Slide in selected library
      const libraryWrapper = this.nextLibraries[library.contentId];
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
        self.currentLibraryWrapper.remove();
        self.currentLibraryWrapper = libraryWrapper;
        self.currentLibraryWrapper.classList.remove('h5p-next');
        self.currentLibraryWrapper.classList.remove('h5p-slide-in');
        self.currentLibraryElement = libraryWrapper.getElementsByClassName('h5p-branching-scenario-content')[0];
        self.createNextLibraries(library);
        self.parent.navigating = false;
        self.navButton.focus();
      });
    }
    else { // Show a branching question

      // Remove existing branching questions
      this.branchingQuestions.forEach(bq => bq.remove());

      // Add an overlay if it doesn't exist yet
      if (this.overlay === undefined) {
        this.overlay = document.createElement('div');
        this.overlay.className = 'h5p-branching-scenario-overlay';
        this.wrapper.append(this.overlay);
        this.hideBackgroundFromReadspeaker();
      }

      const branchingQuestion = document.createElement('div');
      branchingQuestion.className = 'h5p-branching-question-wrapper';

      this.appendRunnable(branchingQuestion, library.type);
      this.wrapper.append(branchingQuestion);
      this.branchingQuestions.push(branchingQuestion);

      const questionContainer = branchingQuestion.querySelector('.h5p-branching-question-container');
      questionContainer.classList.add('h5p-start-outside');
      questionContainer.classList.add('h5p-fly-in');

      this.currentLibraryWrapper.style.zIndex = 0;
      this.createNextLibraries(library);
      this.parent.navigating = false;

      branchingQuestion.addEventListener('animationend', function () {
        const firstAlternative = branchingQuestion.querySelectorAll('.h5p-branching-question-alternative')[0];
        firstAlternative.focus();
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
    this.wrapper.remove();
  };

  LibraryScreen.prototype.resize = function (event) {
    const canScaleImage = (this.currentLibraryInstance && this.currentLibraryInstance.libraryInfo.machineName === 'H5P.Image' && this.currentLibraryInstance.width && this.currentLibraryInstance.height);
    if (canScaleImage) {
      // Always reset scaling
      this.currentLibraryElement.style.width = '';
      this.currentLibraryElement.style.height = '';
    }

    // Toggle full screen class for content (required for IV to resize properly)
    if (this.parent.isFullScreen()) {
      this.currentLibraryElement.classList.add('h5p-fullscreen');

      // Preserve aspect ratio for Image in fullscreen (since height is limited) instead of scrolling or streching
      if (canScaleImage) {
        const availableSpace = this.currentLibraryElement.getBoundingClientRect();
        const availableAspectRatio = (availableSpace.height / availableSpace.width);

        const aspectRatio = (this.currentLibraryInstance.height / this.currentLibraryInstance.width);

        if (aspectRatio > availableAspectRatio) {
          this.currentLibraryElement.style.width = (availableSpace.height * (this.currentLibraryInstance.width / this.currentLibraryInstance.height)) + 'px';
        }
        else {
          this.currentLibraryElement.style.height = (availableSpace.width * aspectRatio) + 'px';
        }
      }
    }
    else {
      this.currentLibraryElement.classList.remove('h5p-fullscreen');
    }

    this.currentLibraryInstance.trigger('resize', event);
  };

  return LibraryScreen;
})();
