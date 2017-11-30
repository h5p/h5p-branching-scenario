H5P = H5P || {};

H5P.BranchingScenario = function (params, contentId) {
  var self = this;
  H5P.EventDispatcher.call(self);
  this.contentId = contentId;

  // State
  var currentScreen;
  var nextLibraryId;
  var nextScreen;

  var createWrapper = function() {
    var wrapper = document.createElement('div');

    var navButton = document.createElement('button');
    navButton.onclick = function() {
      self.trigger('navigated', nextLibraryId);
    };

    var text = document.createTextNode('Proceed'); // TODO: use translatable
    navButton.append(text);

    var header = document.createElement('div');
    header.append(navButton);
    wrapper.append(header);

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
  var addRunnable = function(content, contentData) {
    // Create container for content
    var container = document.createElement('div');
    container.classList.add('h5p-branching-scenario-content');

    // Content overrides
    var library = content.library.split(' ')[0];
    if (library === 'H5P.Video') {
      // Prevent video from growing endlessly since height is unlimited.
      content.params.visuals.fit = false;
    }

    // Create content instance
    var instance = H5P.newRunnable(content, contentId, H5P.jQuery(container), true, contentData);
    instance.on('navigated', function(e) {
      self.trigger('navigated', e.data);
    });

    // Remove any fullscreen buttons
    disableFullscreen(instance);

    return container;
  };

  var createStartScreen = function() {
    var startScreenWrapper = document.createElement('div');
    startScreenWrapper.className = 'h5p-branch-scenario-current-screen';

    var titleText = document.createElement('p');
    titleText.className = 'h5p-branching-scenario-title-text';
    titleText.innerHTML = 'Title of start screen'; // TODO: title text from params

    var subtitleText = document.createElement('p');
    subtitleText.className = 'h5p-branching-scenario-subtitle-text';
    subtitleText.innerHTML = 'Subtitle of start screen'; // TODO: title text from params

    var navButton = document.createElement('button');
    navButton.onclick = function() {
      self.trigger('started');
    };
    var buttonText = document.createTextNode('Proceed start screen'); // TODO: use translatable
    navButton.append(buttonText);

    startScreenWrapper.append(titleText);
    startScreenWrapper.append(subtitleText);
    startScreenWrapper.append(navButton);

    return startScreenWrapper;
  };

  var getLibrary = function(id) {
    for (var i = 0; i < params.content.length; i ++) {
      if (params.content[i].contentId === id) {
        return params.content[i];
      }
    }
    return -1;
  };

  var createLibraryScreen = function(library) {
    var wrapper = createWrapper();
    wrapper.className = 'h5p-branching-scenario-next-screen';

    var contentTypeWrapper = document.createElement('div');
    contentTypeWrapper.append(addRunnable(library.content));

    wrapper.append(contentTypeWrapper);

    return wrapper;
  };

  var createEndScreen = function() {
    var endScreenWrapper = document.createElement('div');
    endScreenWrapper.className = 'h5p-branching-scenario-next-screen';

    var titleText = document.createElement('p');
    titleText.className = 'h5p-branching-scenario-title-text';
    titleText.innerHTML = 'Title of end screen'; // TODO: title text from params

    var subtitleText = document.createElement('p');
    subtitleText.className = 'h5p-branching-scenario-subtitle-text';
    subtitleText.innerHTML = 'Subtitle of end screen'; // TODO: title text from params

    endScreenWrapper.append(titleText);
    endScreenWrapper.append(subtitleText);

    return endScreenWrapper;
  };

  var createBranchingQuestion = function(branchingQuestion) {
    var branchingQuestionWrapper = document.createElement('div');
    branchingQuestionWrapper.append(addRunnable(branchingQuestion.content));
    return branchingQuestionWrapper;
  };

  var replaceCurrentScreenWithNextScreen = function() {
    self.container.append(nextScreen);
    // Hide current screen and show the next one
    currentScreen.className = 'h5p-branching-scenario-hidden';
    nextScreen.className = 'h5p-branching-scenario-current-screen';

    // Update the current screen
    currentScreen.parentNode.removeChild(currentScreen);
    currentScreen = nextScreen;
    nextScreen = undefined;
  };

  self.on('started', function() {
    replaceCurrentScreenWithNextScreen();
  });

  self.on('navigated', function(e) {
    var nextLibrary = getLibrary(e.data);

    if (nextLibrary === -1) {
      nextScreen = createEndScreen();
      replaceCurrentScreenWithNextScreen();
    }
    else if (nextLibrary.content.library !== 'H5P.BranchingQuestion 1.0') {
      nextScreen = createLibraryScreen(nextLibrary);
      replaceCurrentScreenWithNextScreen();
      nextLibraryId = nextLibrary.nextContentId;
    }
    else if (nextLibrary.content.library === 'H5P.BranchingQuestion 1.0') {
      currentScreen.append(createBranchingQuestion(nextLibrary));
    }
  });

  self.attach = function($container) {

    currentScreen = createStartScreen();
    var currentLibrary = getLibrary(0);
    nextScreen = createLibraryScreen(currentLibrary);
    nextLibraryId = currentLibrary.nextContentId;

    // Add the start screen to the DOM and render the next one
    self.container = $container;
    $container.addClass('h5p-branching-scenario').html('');
    $container.append(currentScreen);
    $container.append(nextScreen);
  };

  /**
   * Remove custom fullscreen buttons from sub content.
   * (A bit of a hack, there should have been some sort of override…)
   *
   * @param {Object} instance
   */
  function disableFullscreen(instance) {
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
  }
};

H5P.BranchingScenario.prototype = Object.create(H5P.EventDispatcher.prototype);
H5P.BranchingScenario.prototype.constructor = H5P.BranchingScenario;
