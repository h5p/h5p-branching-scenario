H5P.BranchingScenario.LibraryScreen = (function() {

  /**
   * LibraryScreen
   *
   * @param  {BranchingScenario} parent     BranchingScenario object
   * @param  {string} courseTitle           description
   * @param  {Object} library               H5P Library Data
   * @return {LibraryScreen}
   */
  function LibraryScreen(parent, courseTitle, library) {
    this.parent = parent;
    this.currentLibrary;
    this.currentLibraryElement;
    this.currentLibraryInstance;
    this.nextLibraryId = library.nextContentId;
    this.nextLibraries = {};
    this.libraryInstances = {};
    this.libraryTitle;
    this.branchingQuestions = [];

    this.wrapper = library.showContentTitle ? this.createWrapper(courseTitle, library.contentTitle) : this.createWrapper(courseTitle);
    this.wrapper.classList.add('h5p-next-screen');
    this.wrapper.classList.add('h5p-branching-hidden');

    var libraryWrapper = this.createLibraryElement(library, false);
    this.currentLibraryWrapper = libraryWrapper;
    this.currentLibraryElement = libraryWrapper.getElementsByClassName('h5p-branching-scenario-content')[0];
    this.currentLibraryInstance = this.libraryInstances[0]; // TODO: Decide whether the start screen id should be hardcoded

    this.createNextLibraries(library);

    this.wrapper.append(libraryWrapper);
  }

  LibraryScreen.prototype.createWrapper = function(courseTitle, libraryTitle) {
    var wrapper = document.createElement('div');

    var titleDiv = document.createElement('div');
    titleDiv.classList.add('h5p-title-wrapper');

    var headerTitle = document.createElement('h1');
    headerTitle.innerHTML = courseTitle;
    titleDiv.append(headerTitle);

    var headerSubtitle = document.createElement('h2');
    headerSubtitle.classList = 'library-subtitle';
    headerSubtitle.innerHTML = libraryTitle ? libraryTitle : '';
    titleDiv.append(headerSubtitle);

    this.libraryTitle = headerSubtitle;

    var buttonWrapper = document.createElement('div');
    buttonWrapper.classList.add('h5p-nav-button-wrapper');
    var navButton = document.createElement('button');

    var self = this;
    var parent = this.parent;
    navButton.onclick = function() {
      parent.trigger('navigated', self.nextLibraryId);
    };
    navButton.classList.add('h5p-nav-button');

    navButton.append(document.createTextNode(parent.params.proceedButtonText));
    buttonWrapper.append(navButton);

    var header = document.createElement('div');
    header.classList.add('h5p-screen-header');

    header.append(titleDiv);
    header.append(buttonWrapper);
    wrapper.append(header);

    // Resize container on animation end
    wrapper.addEventListener("animationend", function(event) {
      if (event.animationName === 'slide-in' && self.currentLibraryElement) {
        // Resize, TODO: Remove hardcoded padding
        setTimeout(function() {
          self.currentLibrary.style.height = self.currentLibraryElement.clientHeight + 20 + 'px';
          parent.trigger('resize');
        }, 800);
      }
    });

    return wrapper;
  };

  LibraryScreen.prototype.createLibraryElement = function (library, isNextLibrary) {
    var wrapper = document.createElement('div');
    wrapper.classList.add('h5p-library-wrapper');

    var libraryElement = document.createElement('div');
    libraryElement.classList.add('h5p-branching-scenario-content');

    this.appendRunnable(libraryElement, library.content, library.contentId);

    wrapper.append(libraryElement);

    if (isNextLibrary) {
      wrapper.classList.add('h5p-next');
      libraryElement.classList.add('h5p-branching-hidden');
    }

    return wrapper;
  };

  /**
   * Creates a new ontent instance from the given content parameters and
   * then attaches it the wrapper. Sets up event listeners.
   *
   * @private
   * @param {Object} content Parameters
   * @param {Object} [contentData] Content Data
   */
  LibraryScreen.prototype.appendRunnable = function(container, content) {
    var parent = this.parent;

    var library = content.library.split(' ')[0];
    if (library === 'H5P.Video') {
      // Prevent video from growing endlessly since height is unlimited.
      content.params.visuals.fit = false;
    }
    if (library === 'H5P.BranchingQuestion') {
      content.params.proceedButtonText = parent.params.proceedButtonText;
    }

    // Create content instance
    var instance = H5P.newRunnable(content, this.parent.contentId, H5P.jQuery(container), true);

    instance.on('navigated', function(e) {
      parent.trigger('navigated', e.data);
    });

    this.libraryInstances[id] = instance;

    // Bubble resize events
    this.bubbleUp(instance, 'resize', parent);

    // Remove any fullscreen buttons
    this.disableFullscreen(instance);
  };

  /**
   * Pre-render the next libraries for smooth transitions
   * @param  {Object} library Library Data
   */
  LibraryScreen.prototype.createNextLibraries = function (library) {
    this.nextLibraries = {};

    // If not a branching question, just load the next library
    if (library.content.library !== 'H5P.BranchingQuestion 1.0') {
      var nextLibrary = this.parent.getLibrary(library.nextContentId);
      if (nextLibrary === false) {
        return; // Do nothing if the next screen is an end screen
      }
      // Do not pre-render branching questions
      if (nextLibrary.content.library !== 'H5P.BranchingQuestion 1.0') {
        this.nextLibraries[library.nextContentId] = this.createLibraryElement(nextLibrary, true);
        this.wrapper.append(this.nextLibraries[library.nextContentId]);
      }
    }

    // If it is a branching question, load all the possible libraries
    else {
      var ids = library.content.params.alternatives.map(alternative => alternative.nextContentId); // TODO: transpile
      ids.forEach(nextContentId => {
        var nextLibrary = this.parent.getLibrary(nextContentId);
        if (nextLibrary === false) {
          return; // Do nothing if the next screen is an end screen
        }
        // Do not pre-render branching questions
        if (nextLibrary.content && nextLibrary.content.library !== 'H5P.BranchingQuestion 1.0') {
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
   * @param {Object} instance
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
   */
  LibraryScreen.prototype.bubbleUp = function(origin, eventName, target) {
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
   */
  LibraryScreen.prototype.show = function () {
    var self = this;
    self.wrapper.classList.add('h5p-slide-in');
    self.wrapper.classList.remove('h5p-branching-hidden');

    // Style as the current screen
    self.wrapper.addEventListener('animationend', function() {
      self.wrapper.classList.remove('h5p-next-screen');
      self.wrapper.classList.remove('h5p-slide-in');
      self.wrapper.classList.add('h5p-current-screen');
    });
  };

  /**
   * Slides the screen out and styles it to be hidden
   */
  LibraryScreen.prototype.hide = function () {
    var self = this;

    // Remove possible alternative libaries
    for (var i = 0; i < this.nextLibraries.length; i++) {
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

    self.wrapper.addEventListener('animationend', function() {
      self.wrapper.classList.remove('h5p-current-screen');
      self.wrapper.classList.add('h5p-next-screen');
      self.wrapper.classList.remove('h5p-slide-out');
    });
  };

  /**
   * Slides in the next library which may be either a 'normal content type' or a
   * branching question
   *
   * @param  {Object} library Library data
   */
  LibraryScreen.prototype.showNextLibrary = function (library) {
    this.nextLibraryId = library.nextContentId;

    // Show normal h5p library
    if (library.content.library !== 'H5P.BranchingQuestion 1.0') {
      // Update the title
      this.libraryTitle.innerHTML = library.contentTitle ? library.contentTitle : '';

      // Slide out the current library
      this.currentLibraryWrapper.classList.add('h5p-slide-out');
      this.currentLibraryWrapper.style.height = 0;

      // Remove the branching questions if they exist
      if (this.overlay) {
        this.overlay.remove();
        this.overlay = undefined;
        this.branchingQuestions.forEach(bq => bq.remove());
      }

      // Remove pre-rendered libraries that were not selected
      for (var i = 0; i < this.nextLibraries.length; i++) {
        this.nextLibraries[i].remove();
      }

      // Slide in selected library
      var libraryWrapper = this.nextLibraries[library.contentId];
      libraryWrapper.classList.add('h5p-slide-in');
      var libraryElement = libraryWrapper.getElementsByClassName('h5p-branching-scenario-content')[0];
      libraryElement.classList.remove('h5p-branching-hidden');

      this.currentLibraryInstance = this.libraryInstances[library.contentId];
      if (this.currentLibraryInstance.resize) {
        this.currentLibraryInstance.resize();
      }

      var self = this;
      this.currentLibraryWrapper.addEventListener('animationend', function() {
        self.currentLibrary.remove();
        self.currentLibrary = libraryWrapper;
        self.currentLibrary.classList.remove('h5p-next');
        self.currentLibrary.classList.remove('h5p-slide-in');
        self.currentLibraryElement = libraryWrapper.getElementsByClassName('h5p-branching-scenario-content')[0];
        self.createNextLibraries(library);
      });
      // TODO: Do not slide in the next slide if it is the same as the current one
    }
    else { // Show a branching question

      // Remove existing branching questions
      this.branchingQuestions.forEach(bq => bq.remove());

      // Add an overlay if it doesn't exist yet
      if (this.overlay === undefined) {
        this.overlay = document.createElement('div');
        this.overlay.className = 'h5p-branching-scenario-overlay';
        this.wrapper.append(this.overlay);
        this.disableTabbables();
      }

      var branchingQuestion = document.createElement('div');
      branchingQuestion.className = 'h5p-branching-question-wrapper';

      this.appendRunnable(branchingQuestion, library.content);
      this.wrapper.append(branchingQuestion);
      this.branchingQuestions.push(branchingQuestion);

      var branchingQuestionActual = branchingQuestion.getElementsByClassName('h5p-branching-question')[0];
      branchingQuestionActual.classList.add('h5p-start-outside');
      branchingQuestionActual.classList.add('h5p-fly-in');

      this.currentLibraryWrapper.style.zIndex = 0;
      this.createNextLibraries(library);
    }
  };

  /**
   * Used to disable all tabbables behind overlay
   */
  LibraryScreen.prototype.disableTabbables = function () {
    var libraryTabbables = this.currentLibraryWrapper.querySelectorAll('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]');
    Array.from(libraryTabbables).forEach(tabbable => {
      tabbable.setAttribute('tabIndex', -1);
    });

    var navigationButton = this.wrapper.getElementsByClassName('h5p-screen-header')[0].getElementsByTagName('button')[0];
    navigationButton.setAttribute('tabIndex', '-1');
  };

  LibraryScreen.prototype.getElement = function () {
    return this.wrapper;
  };

  LibraryScreen.prototype.remove = function () {
    this.wrapper.remove();
  };

  LibraryScreen.prototype.resize = function (event) {
    this.currentLibraryInstance.trigger('resize', event);
  };

  return LibraryScreen;
})();
