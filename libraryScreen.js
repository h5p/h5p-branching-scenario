H5P.BranchingScenario.LibraryScreen = (function() {

  function LibraryScreen(parent, courseTitle, library) {
    this.parent = parent;

    this.wrapper = library.showContentTitle ? this.createWrapper(courseTitle, library.contentTitle) : this.createWrapper(courseTitle);
    this.wrapper.classList.add('h5p-next-screen');

    var libraryWrapper = document.createElement('div');
    libraryWrapper.classList.add('h5p-library-wrapper');

    var libraryElement = document.createElement('div');
    libraryElement.classList.add('h5p-branching-scenario-content');

    this.appendRunnable(libraryElement, library.content);

    libraryWrapper.append(libraryElement);
    this.wrapper.append(libraryWrapper);
  }

  LibraryScreen.prototype.getElement = function() {
    return this.wrapper;
  };

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
      headerSubtitle.innerHTML = libraryTitle;
      titleDiv.append(headerSubtitle);
    }

    var buttonWrapper = document.createElement('div');
    buttonWrapper.classList.add('h5p-nav-button-wrapper');
    var navButton = document.createElement('button');

    var self = this.parent;
    navButton.onclick = function() {
      self.trigger('navigated', self.nextLibraryId);
    };
    navButton.classList.add('h5p-nav-button');
    navButton.append(document.createTextNode('Proceed'));
    buttonWrapper.append(navButton);

    var header = document.createElement('div');
    header.classList.add('h5p-screen-header');

    header.append(titleDiv);
    header.append(buttonWrapper);
    wrapper.append(header);

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
    this.parent.currentLibraryInstance = H5P.newRunnable(content, this.parent.contentId, H5P.jQuery(container), true, contentData);
    var self = this.parent;
    this.parent.currentLibraryInstance.on('navigated', function(e) {
      self.trigger('navigated', e.data);
    });

    // Bubble resize events
    this.bubbleUp(this.parent.currentLibraryInstance, 'resize', self);

    // Remove any fullscreen buttons
    this.disableFullscreen(this.parent.currentLibraryInstance);
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

  return LibraryScreen;
})();
