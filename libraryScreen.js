H5P.BranchingScenario.LibraryScreen = (function() {

  function LibraryScreen(parent, courseTitle, library) {
    this.parent = parent;
    this.nextLibraryId = library.nextContentId;
    this.currentLibrary;
    this.currentLibraryElement;

    this.wrapper = library.showContentTitle ? this.createWrapper(courseTitle, library.contentTitle) : this.createWrapper(courseTitle);
    this.wrapper.classList.add('h5p-next-screen');

    var libraryWrapper = this.createLibraryElement(library, false);
    this.currentLibrary = libraryWrapper;
    this.wrapper.append(libraryWrapper);
  }

  LibraryScreen.prototype.createWrapper = function(courseTitle, libraryTitle) {
    var wrapper = document.createElement('div');

    var titleDiv = document.createElement('div');
    titleDiv.classList.add('h5p-title-wrapper');

    var headerTitle = document.createElement('h1');
    headerTitle.innerHTML = courseTitle;
    titleDiv.append(headerTitle);

    if (libraryTitle) {
      var headerSubtitle = document.createElement('h2');
      headerSubtitle.classList = 'library-subtitle';
      headerSubtitle.innerHTML = libraryTitle ? libraryTitle : '';
      titleDiv.append(headerSubtitle);
    }

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
    navButton.append(document.createTextNode('Proceed'));
    buttonWrapper.append(navButton);

    var header = document.createElement('div');
    header.classList.add('h5p-screen-header');

    header.append(titleDiv);
    header.append(buttonWrapper);
    wrapper.append(header);

    // Resize container on animation end
    wrapper.addEventListener("animationend", function() {
      setTimeout(function() {
        // Resize, TODO: Remove hardcoded padding
        self.currentLibrary.style.height = self.currentLibraryElement.clientHeight + 20 + 'px';
        parent.trigger('resize');
      }, 2000);
    });

    return wrapper;
  };

  LibraryScreen.prototype.createLibraryElement = function (library, isNextLibrary) {
    var wrapper = document.createElement('div');
    wrapper.classList.add('h5p-library-wrapper');

    if (isNextLibrary) {
      wrapper.classList.add('h5p-next');
      wrapper.classList.add('h5p-slide-in');
    }

    var libraryElement = document.createElement('div');
    libraryElement.classList.add('h5p-branching-scenario-content');

    this.appendRunnable(libraryElement, library.content);
    this.currentLibraryInstance.trigger('resize');

    this.currentLibraryElement = libraryElement;
    wrapper.append(libraryElement);
    return wrapper;
  };

  LibraryScreen.prototype.appendRunnable = function(container, content, contentData) {
    // Content overrides
    var library = content.library.split(' ')[0];
    if (library === 'H5P.Video') {
      // Prevent video from growing endlessly since height is unlimited.
      content.params.visuals.fit = false;
    }

    // Create content instance
    var parent = this.parent;
    this.currentLibraryInstance = H5P.newRunnable(content, this.parent.contentId, H5P.jQuery(container), true, contentData);
    this.currentLibraryInstance.on('navigated', function(e) {
      parent.trigger('navigated', e.data);
    });

    // Bubble resize events
    this.bubbleUp(this.currentLibraryInstance, 'resize', parent);

    // Remove any fullscreen buttons
    this.disableFullscreen(this.currentLibraryInstance);
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

  LibraryScreen.prototype.bubbleUp = function(origin, eventName, target) {
    origin.on(eventName, function (event) {
      // Prevent target from sending event back down
      target.bubblingUpwards = true;
      target.trigger(eventName, event);

      // Reset
      target.bubblingUpwards = false;
    });
  };

  LibraryScreen.prototype.show = function () {
    var self = this;
    self.wrapper.classList.add('h5p-slide-in');

    // Style as the current screen
    self.wrapper.addEventListener('animationend', function() {
      self.wrapper.classList.remove('h5p-next-screen');
      self.wrapper.classList.remove('h5p-slide-in');
      self.wrapper.classList.add('h5p-current-screen');
    });
  };

  LibraryScreen.prototype.hide = function () {
    var self = this;
    self.wrapper.classList.add('h5p-slide-out');

    self.wrapper.addEventListener('animationend', function() {
      self.wrapper.classList.remove('h5p-current-screen');
      self.wrapper.classList.add('h5p-next-screen');
      self.wrapper.classList.remove('h5p-slide-out');
    });
  };

  LibraryScreen.prototype.showNextLibrary = function (library) {
    this.nextLibraryId = library.nextContentId;

    // Show normal h5p library
    if (library.content.library !== 'H5P.BranchingQuestion 1.0') {
      // Update the title
      this.libraryTitle.innerHTML = library.contentTitle ? library.contentTitle : '';

      // Slide out the current library
      this.currentLibrary.classList.add('h5p-slide-out');
      this.currentLibrary.style.height = 0;
      var self = this;

      // Remove the branching question if it exists
      if (this.overlay) {
        this.overlay.remove();
        this.overlay = undefined;
        this.branchingQuestion.remove();
        this.branchingQuestion = undefined;
      }

      // Create next library and slide it in
      var libraryWrapper = this.createLibraryElement(library, true);
      this.wrapper.append(libraryWrapper);

      this.currentLibrary.addEventListener('animationend', function() {
        self.currentLibrary.remove();
        self.currentLibrary = libraryWrapper;
        self.currentLibrary.classList.remove('h5p-next');
        self.currentLibrary.classList.remove('h5p-slide-in');
      });
    }

    else { // Show a branching question

      // Add an overlay if it doesn't exist
      if (this.overlay === undefined) {
        this.overlay = document.createElement('div');
        this.overlay.className = 'h5p-branching-scenario-overlay';
        this.wrapper.append(this.overlay);
      }

      this.branchingQuestion = document.createElement('div');
      this.branchingQuestion.className = 'h5p-branching-question-wrapper';

      this.appendRunnable(this.branchingQuestion, library.content);
      this.wrapper.append(this.branchingQuestion);

      var branchingQuestionActual = this.branchingQuestion.getElementsByClassName('h5p-branching-question')[0];
      branchingQuestionActual.classList.add('h5p-start-outside');
      branchingQuestionActual.classList.add('h5p-fly-in');

      this.currentLibrary.style.zIndex = 0;
    }
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
