H5P = H5P || {};

H5P.BranchingScenario = function (params, contentId) {
  var self = this;
  H5P.EventDispatcher.call(self);
  self.contentId = contentId;

  // State
  var currentScreen;
  var nextLibraryId;
  var nextScreen;
  var currentLibraryInstance;
  var overlayApplied = false;

  var createWrapper = function(courseTitle, libraryTitle) {
    var wrapper = document.createElement('div');

    var titleDiv = document.createElement('div');
    titleDiv.classList.add('h5p-branching-scenario');
    titleDiv.classList.add('h5p-title-wrapper');

    var headerTitle = document.createElement('h1');
    headerTitle.innerHTML = courseTitle;
    titleDiv.append(headerTitle);

    if (libraryTitle) {
      var headerSubtitle = document.createElement('h2');
      headerSubtitle.innerHTML = libraryTitle;
      titleDiv.append(headerSubtitle);
    }

    var buttonWrapper = document.createElement('div');
    buttonWrapper.classList.add('h5p-branching-scenario');
    buttonWrapper.classList.add('h5p-nav-button-wrapper');
    var navButton = document.createElement('button');
    navButton.onclick = function() {
      self.trigger('navigated', nextLibraryId);
    };
    navButton.append(document.createTextNode('Proceed'));
    buttonWrapper.append(navButton);

    var header = document.createElement('div');
    header.classList.add('h5p-branching-scenario');
    header.classList.add('h5p-screen-header');

    header.append(titleDiv);
    header.append(buttonWrapper);
    wrapper.append(header);

    return wrapper;
  };

  var createScreenBackground = function (isStartScreen, image) {
    var backgroundWrapper = document.createElement('div');
    backgroundWrapper.classList.add('h5p-branching-scenario');
    backgroundWrapper.classList.add('h5p-screen-background');

    var backgroundBanner = document.createElement('div');
    backgroundBanner.classList.add('h5p-branching-scenario');
    backgroundBanner.classList.add('h5p-screen-banner');

    var backgroundImage = document.createElement('img');
    backgroundImage.classList.add('h5p-branching-scenario');
    backgroundImage.classList.add('h5p-background-image');

    if (image && image.path) {
      backgroundImage.src = H5P.getPath(image.path, self.contentId);
    }
    else {
      backgroundImage.src = isStartScreen ? 'start-screen-default.jpg' : 'end-screen-default.jpg';
    }

    backgroundWrapper.append(backgroundBanner);
    backgroundWrapper.append(backgroundImage);

    return backgroundWrapper;
  };

  var createResultContainer = function(score) {
    var wrapper = document.createElement('div');
    wrapper.classList.add('h5p-branching-scenario');
    wrapper.classList.add('h5p-result-wrapper');

    var resultContainer = document.createElement('div');
    resultContainer.classList.add('h5p-branching-scenario');
    resultContainer.classList.add('h5p-result-container');

    var scoreText = document.createElement('div');
    scoreText.classList.add('h5p-branching-scenario');
    scoreText.classList.add('h5p-score-text');
    scoreText.append(document.createTextNode('Your score: '));

    var scoreCircle = document.createElement('div');
    scoreCircle.classList.add('h5p-branching-scenario');
    scoreCircle.classList.add('h5p-score-circle');
    scoreCircle.append(document.createTextNode(score));

    resultContainer.append(scoreText);
    resultContainer.append(scoreCircle);
    wrapper.append(resultContainer);
    return wrapper;
  };

  var createScreen = function({isStartScreen, titleText, subtitleText, image, buttonText}) {
    var screenWrapper = document.createElement('div');
    screenWrapper.classList.add('h5p-branching-scenario');
    screenWrapper.classList.add('h5p-start-screen');
    screenWrapper.classList.add('h5p-current-screen');

    var contentDiv = document.createElement('div');
    contentDiv.classList.add('h5p-branching-scenario-screen-content');

    var title = document.createElement('h1');
    title.className = 'h5p-branching-scenario-title-text';
    title.innerHTML = titleText;

    var subtitle = document.createElement('h2');
    subtitle.className = 'h5p-branching-scenario-subtitle-text';
    subtitle.innerHTML = subtitleText;

    var navButton = document.createElement('button');
    navButton.classList.add('h5p-branching-scenario');
    navButton.classList.add(isStartScreen ? 'h5p-start-button' : 'h5p-end-button');

    navButton.onclick = function() {
      isStartScreen ? self.trigger('started') : self.trigger('restarted');
    };
    var buttonTextNode = document.createTextNode(buttonText);
    navButton.append(buttonTextNode);

    contentDiv.append(title);
    contentDiv.append(subtitle);
    contentDiv.append(navButton);

    if (isStartScreen === false) {
      contentDiv.prepend(createResultContainer(121232));
    }

    screenWrapper.append(createScreenBackground(isStartScreen, image));
    screenWrapper.append(contentDiv);

    return screenWrapper;
  };

  var createStartScreen = function({startScreenTitle, startScreenSubtitle, startScreenImage}) {
    return createScreen({
      isStartScreen: true,
      titleText: startScreenTitle,
      subtitleText: startScreenSubtitle,
      image: startScreenImage,
      buttonText: 'Start the course'
    });
  };

  var createEndScreen = function({endScreenTitle, endScreenSubtitle, endScreenImage}) {
    return createScreen({
      isStartScreen: false,
      titleText: endScreenTitle,
      subtitleText: endScreenSubtitle,
      image: endScreenImage,
      buttonText: 'Retry the course'
    });
  };

  var createLibraryScreen = function(courseTitle, library) {
    var wrapper = library.showContentTitle ? createWrapper(courseTitle, library.contentTitle) : createWrapper(courseTitle);
    wrapper.classList.add('h5p-branching-scenario');
    wrapper.classList.add('h5p-next-screen');

    var libraryWrapper = document.createElement('div');
    libraryWrapper.classList.add('h5p-branching-scenario');
    libraryWrapper.classList.add('h5p-library-wrapper');

    appendRunnable(libraryWrapper, library.content);

    wrapper.append(libraryWrapper);

    return wrapper;
  };

  var replaceCurrentScreenWithNextScreen = function() {
    self.container.append(nextScreen);
    // Hide current screen and show the next one
    currentScreen.classList.add('h5p-branching-scenario-hidden');
    nextScreen.classList.remove('h5p-next-screen');
    nextScreen.classList.add('h5p-current-screen');

    // Update the current screen
    currentScreen.parentNode.removeChild(currentScreen);
    currentScreen = nextScreen;
    nextScreen = undefined;

    // Resize
    var libraryElement = self.container[0].getElementsByClassName('h5p-library-wrapper')[0];
    if (libraryElement) {
      // libraryElement.style.height = '22em';
      currentLibraryInstance.trigger('resize');
    }
  };

  self.on('started', function() {
    var currentLibrary = getLibrary(0); // Get the first library
    nextScreen = createLibraryScreen(params.title, currentLibrary);
    nextLibraryId = currentLibrary.nextContentId;
    replaceCurrentScreenWithNextScreen();
  });

  self.on('restarted', function() {
    nextScreen = createStartScreen(params.startscreen);
    replaceCurrentScreenWithNextScreen();
  });

  self.on('navigated', function(e) {

    var nextLibrary = getLibrary(e.data);

    if (nextLibrary === -1) {
      nextScreen = createEndScreen(params.endscreen);
      replaceCurrentScreenWithNextScreen();
      overlayApplied = false;
    }
    else if (nextLibrary.content.library !== 'H5P.BranchingQuestion 1.0') {
      nextScreen = createLibraryScreen(params.title, nextLibrary);
      replaceCurrentScreenWithNextScreen();
      nextLibraryId = nextLibrary.nextContentId;
      overlayApplied = false;
    }
    else if (nextLibrary.content.library === 'H5P.BranchingQuestion 1.0') {

      if (overlayApplied === false) {
        var overlay = document.createElement('div');
        overlay.className = 'h5p-branching-scenario-overlay';
        currentScreen.append(overlay);
        overlayApplied = true;
      }

      var branchingQuestionWrapper = document.createElement('div');
      branchingQuestionWrapper.className = 'h5p-branching-scenario';
      branchingQuestionWrapper.className = 'h5p-branching-question-wrapper';
      appendRunnable(branchingQuestionWrapper, nextLibrary.content);
      currentScreen.append(branchingQuestionWrapper);

      var libraryElement = self.container[0].getElementsByClassName('h5p-wrapper')[0];
      if (libraryElement) {
        libraryElement.style.zIndex = 0;
      }
    }
  });

  self.attach = function($container) {
    currentScreen = createStartScreen(params.startscreen);
    var currentLibrary = getLibrary(0);
    nextScreen = createLibraryScreen(params.title, currentLibrary);
    nextLibraryId = currentLibrary.nextContentId;

    // Add the start screen to the DOM and render the next one
    self.container = $container;
    $container.addClass('h5p-branching-scenario').html('');
    $container.append(currentScreen);
    $container.append(nextScreen);

    replaceCurrentScreenWithNextScreen();

    var proceedbutton = self.container[0].getElementsByTagName('button')[0];
    // proceedbutton.click();


  };

  /**
   * Remove custom fullscreen buttons from sub content.
   * (A bit of a hack, there should have been some sort of override…)
   *
   * @param {Object} instance
   */
  var disableFullscreen = function (instance) {
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

  var getLibrary = function(id) {
    for (var i = 0; i < params.content.length; i ++) {
      if (params.content[i].contentId === id) {
        return params.content[i];
      }
    }
    return -1;
  };

  var appendRunnable = function(container, content, contentData) {
    // Content overrides
    var library = content.library.split(' ')[0];
    if (library === 'H5P.Video') {
      // Prevent video from growing endlessly since height is unlimited.
      content.params.visuals.fit = false;
    }

    // Create content instance
    currentLibraryInstance = H5P.newRunnable(content, contentId, H5P.jQuery(container), true, contentData);
    currentLibraryInstance.on('navigated', function(e) {
      self.trigger('navigated', e.data);
    });

    // Bubble resize events
    bubbleUp(currentLibraryInstance, 'resize', self);

    // Remove any fullscreen buttons
    disableFullscreen(currentLibraryInstance);
  };

  /**
   * Makes it easy to bubble events from child to parent
   *
   * @private
   * @param {Object} origin Origin of the Event
   * @param {string} eventName Name of the Event
   * @param {Object} target Target to trigger event on
   */
  function bubbleUp(origin, eventName, target) {
    origin.on(eventName, function (event) {
      // Prevent target from sending event back down
      target.bubblingUpwards = true;

      // Trigger event
      target.trigger(eventName, event);

      // Reset
      target.bubblingUpwards = false;
    });
  };

};

H5P.BranchingScenario.prototype = Object.create(H5P.EventDispatcher.prototype);
H5P.BranchingScenario.prototype.constructor = H5P.BranchingScenario;
