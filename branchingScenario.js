H5P = H5P || {};

H5P.BranchingScenario = function (params, contentId) {
  var self = this;
  H5P.EventDispatcher.call(self);
  self.contentId = contentId;

  // State
  var currentScreen;
  self.nextLibraryId;
  var nextScreen;
  self.currentLibraryInstance;
  var overlayApplied = false;

  var createStartScreen = function({startScreenTitle, startScreenSubtitle, startScreenImage}) {
    var startScreen = new H5P.BranchingScenario.GenericScreen(self, {
      isStartScreen: true,
      titleText: startScreenTitle,
      subtitleText: startScreenSubtitle,
      image: startScreenImage,
      buttonText: 'Start the course'
    });

    return startScreen.getElement();
  };

  var createEndScreen = function({endScreenTitle, endScreenSubtitle, endScreenImage}) {
    var endScreen = new H5P.BranchingScenario.GenericScreen(self, {
      isStartScreen: false,
      titleText: endScreenTitle,
      subtitleText: endScreenSubtitle,
      image: endScreenImage,
      buttonText: 'Restart the course'
    });

    return endScreen.getElement();
  };

  var showNextLibrary = function(screen, library) {
    // Update title
    if (library.contentTitle) {
      var title = screen.getElementsByClassName('library-subtitle')[0];
      title.innerHTML = library.contentTitle;
    }

    // Slide out the previous library
    var currentLibraryWrapper = screen.getElementsByClassName('h5p-library-wrapper')[0];
    currentLibraryWrapper.classList.add('h5p-slide-out');
    currentLibraryWrapper.style.height = 0;

    // Remove the branching question if it exists
    var branchingQuestionWrapper = screen.getElementsByClassName('h5p-branching-question-wrapper')[0];
    if (branchingQuestionWrapper) {
      branchingQuestionWrapper.remove();
      var overlay = screen.getElementsByClassName('h5p-branching-scenario-overlay')[0];
      if (overlay) {
        overlay.remove();
        overlayApplied = false;
      }
    }

    // Create the next library and slide it in
    var nextLibraryWrapper = document.createElement('div');
    nextLibraryWrapper.classList.add('h5p-library-wrapper');
    nextLibraryWrapper.classList.add('h5p-next');

    var nextLibraryElement = document.createElement('div');
    nextLibraryElement.classList.add('h5p-branching-scenario-content');

    appendRunnable(nextLibraryElement, library.content);
    self.currentLibraryInstance.trigger('resize');

    nextLibraryWrapper.append(nextLibraryElement);
    screen.append(nextLibraryWrapper);

    nextLibraryWrapper.classList.add('h5p-slide-in');

    // Set the min height to the height of the incoming library for smoother resizing
    setTimeout(function() {
      currentScreen.style.minHeight = nextLibraryElement.clientHeight + 40 + 90 + 'px';
    }, 1000);

    // Resize container on animation end
    nextLibraryWrapper.addEventListener("animationend", function(event) {
      if (event.animationName === 'slide-out') {
        return; // Only run on 'slide-in' so the code below is not executed twice
      }

      // Resize
      nextLibraryWrapper.style.height = nextLibraryElement.clientHeight + 20 + 'px';

      // Update styles and remove the library that has been slid out
      nextLibraryWrapper.classList.remove('h5p-next');
      nextLibraryWrapper.classList.remove('h5p-slide-in');
      Array.from(screen.getElementsByClassName('h5p-slide-out')).forEach(item => {
        item.remove();
      });
      self.trigger('resize');
    }, false);
  };

  var showNextScreen = function() {
    self.container.append(nextScreen);
    // Slide the current screen out and the next one in
    currentScreen.classList.add('h5p-slide-out');
    nextScreen.classList.add('h5p-slide-in');

    nextScreen.addEventListener('animationend', function(event) {
      if (event.target.classList.contains('h5p-next-screen')) {
        nextScreen.classList.remove('h5p-next-screen');
        nextScreen.classList.remove('h5p-slide-in');
        nextScreen.classList.add('h5p-current-screen');
        // Update the current screen
        currentScreen.parentNode.removeChild(currentScreen);
        currentScreen = nextScreen;
        nextScreen = undefined;
      }
    });
  };

  self.on('started', function() {
    var currentLibrary = getLibrary(0); // Get the first library
    var library = new H5P.BranchingScenario.LibraryScreen(self, params.title, currentLibrary);
    nextScreen = library.getElement();
    self.nextLibraryId = currentLibrary.nextContentId;
    showNextScreen();
  });

  self.on('restarted', function() {
    nextScreen = createStartScreen(params.startscreen);
    nextScreen.classList.add('h5p-next-screen');
    showNextScreen();
  });

  self.on('navigated', function(e) {

    self.trigger('resize');

    var nextLibrary = getLibrary(e.data);

    if (nextLibrary === -1) {
      nextScreen = createEndScreen(params.endscreen);
      nextScreen.classList.add('h5p-next-screen');
      showNextScreen();
    }
    else if (nextLibrary.content.library !== 'H5P.BranchingQuestion 1.0') {
      showNextLibrary(currentScreen, nextLibrary);
      self.nextLibraryId = nextLibrary.nextContentId;
    }
    else if (nextLibrary.content.library === 'H5P.BranchingQuestion 1.0') {
      if (overlayApplied === false) {
        var overlay = document.createElement('div');
        overlay.className = 'h5p-branching-scenario-overlay';
        currentScreen.append(overlay);
      }

      var branchingQuestionWrapper = document.createElement('div');
      branchingQuestionWrapper.className = 'h5p-branching-question-wrapper';
      appendRunnable(branchingQuestionWrapper, nextLibrary.content);
      currentScreen.append(branchingQuestionWrapper);

      var libraryElement = self.container[0].getElementsByClassName('h5p-wrapper')[0];
      if (libraryElement) {
        libraryElement.style.zIndex = 0;
      }
    }
  });

  self.on('resize', function (event) {
    if (self.bubblingUpwards) {
      return; // Prevent sending the event back down
    }

    self.currentLibraryInstance.trigger('resize', event);
  });

  self.attach = function($container) {
    currentScreen = createStartScreen(params.startscreen);
    currentScreen.classList.add('h5p-current-screen');

    var currentLibrary = getLibrary(0);
    self.nextLibraryId = currentLibrary.nextContentId;
    var libraryScreen = new H5P.BranchingScenario.LibraryScreen(self, params.title, currentLibrary);
    nextScreen = libraryScreen.getElement();

    // Add the start screen to the DOM and render the next one
    self.container = $container;
    $container.addClass('h5p-branching-scenario').html('');
    $container.append(currentScreen);

    // Uncomment for quick debugging
    // showNextScreen();
    var proceedbutton = self.container[0].getElementsByTagName('button')[0];
    proceedbutton.click();
  };

  var getLibrary = function(id) {
    for (var i = 0; i < params.content.length; i ++) {
      if (params.content[i].contentId === id) {
        return params.content[i];
      }
    }
    return -1;
  };
};

H5P.BranchingScenario.prototype = Object.create(H5P.EventDispatcher.prototype);
H5P.BranchingScenario.prototype.constructor = H5P.BranchingScenario;
