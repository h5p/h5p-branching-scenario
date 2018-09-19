H5P = H5P || {};

H5P.BranchingScenario = function (params, contentId) {
  const self = this;

  H5P.EventDispatcher.call(self);
  self.contentId = contentId;
  self.startScreen = {};
  self.libraryScreen = {};
  self.endScreens = {};
  self.navigating;
  self.currentHeight;
  self.currentId = 0;

  const SCORE_TYPES = {
    STATIC_SCORE: 'static-end-score',
    DYNAMIC_SCORE: 'dynamic-score',
    NO_SCORE: 'no-score',
  };

  /**
   * Keep track of achieved score per slide.
   * If a question is attempted multiple times (loops), last score counts.
   *
   * @type {Array}
   */
  self.scores = [];

  /**
   * Extend an array just like JQuery's extend.
   * @param {...Object} arguments - Objects to be merged.
   * @return {Object} Merged objects.
   */
  const extend = function () {
    for (var i = 1; i < arguments.length; i++) {
      for (var key in arguments[i]) {
        if (arguments[i].hasOwnProperty(key)) {
          if (typeof arguments[0][key] === 'object' &&
          typeof arguments[i][key] === 'object') {
            extend(arguments[0][key], arguments[i][key]);
          }
          else {
            arguments[0][key] = arguments[i][key];
          }
        }
      }
    }
    return arguments[0];
  };

  params = extend({
    content: [],
    startScreen: {
      startScreenTitle: "Start",
      startScreenSubtitle: ""
    },
    endScreens: [
      {
        endScreenTitle: "The End",
        endScreenSubtitle: "",
        contentId: -1
      }
    ],
    startScreenButtonText: "Start the course",
    endScreenButtonText: "Restart the course",
    proceedButtonText: "Proceed",
    title: "Branching Scenario"
  }, params.branchingScenario); // Account for the wrapper!

  // Sanitize the (next)ContentIds that the editor didn't set
  params.content.forEach((item, index) => {
    item.contentId = item.contentId || index;
    item.nextContentId = item.nextContentId || -1;
  });

  self.params = params;

  /**
   * Create a start screen object
   *
   * @param  {Object} startscreendata Object containing data needed to build a start screen
   * @param  {string} startscreendata.startScreenTitle Title
   * @param  {string} startscreendata.startScreenSubtitle Subtitle
   * @param  {Object} startscreendata.startScreenImage Object containing image metadata
   * @param  {boolean} isCurrentScreen When Branching Scenario is first initialized
   * @return {H5P.BranchingScenario.GenericScreen} Generic Screen object
   */
  const createStartScreen = function({startScreenTitle, startScreenSubtitle, startScreenImage}, isCurrentScreen) {
    const startScreen = new H5P.BranchingScenario.GenericScreen(self, {
      isStartScreen: true,
      titleText: startScreenTitle,
      subtitleText: startScreenSubtitle,
      image: startScreenImage,
      buttonText: params.startScreenButtonText,
      isCurrentScreen
    });

    startScreen.on('toggleFullScreen', () => {
      self.toggleFullScreen();
    });

    return startScreen;
  };

  /**
   * Create an end screen object
   *
   * @param  {Object} endScreenData Object containing data needed to build an end screen
   * @param  {string} endScreenData.endScreenTitle Title
   * @param  {string} endScreenData.endScreenSubtitle Subtitle
   * @param  {Object} endScreenData.endScreenImage Object containing image metadata
   * @param  {Object} endScreenData.endScreenScore Score
   * @param  {Object} endScreenData.showScore Determines if score is shown
   * @return {H5P.BranchingScenario.GenericScreen} Generic Screen object
   */
  const createEndScreen = function (endScreenData) {
    const showScore = self.params.scoringOption === SCORE_TYPES.STATIC_SCORE
      || self.params.scoringOption === SCORE_TYPES.DYNAMIC_SCORE;

    const score = self.params.scoringOption === SCORE_TYPES.DYNAMIC_SCORE
      ? self.getScore()
      : endScreenData.endScreenScore;

    const endScreen = new H5P.BranchingScenario.GenericScreen(self, {
      isStartScreen: false,
      titleText: endScreenData.endScreenTitle,
      subtitleText: endScreenData.endScreenSubtitle,
      image: endScreenData.endScreenImage,
      buttonText: params.endScreenButtonText,
      isCurrentScreen: false,
      scoreText: params.scoreText,
      score: score,
      showScore: showScore,
    });

    endScreen.on('toggleFullScreen', () => {
      self.toggleFullScreen();
    });

    return endScreen;
  };

  /**
   * Get library data by id from branching scenario parameters
   *
   * @param  {number} id Id of the content type
   * @return {Object | boolean} Data required to create a library
   */
  self.getLibrary = function(id) {
    for (let i = 0; i < params.content.length; i ++) {
      if (params.content[i].contentId === id) {
        return params.content[i];
      }
    }
    return false;
  };

  /**
   * Handle the start of the branching scenario
   */
  self.on('started', function() {
    self.startScreen.hide();
    self.libraryScreen.show();
    self.triggerXAPI('progressed');
    self.currentId = 0;
  });

  /**
   * Handle progression
   */
  self.on('navigated', function(e) {
    self.trigger('resize');
    self.triggerXAPI('progressed');
    const id = e.data.nextContentId;
    const nextLibrary = self.getLibrary(id);
    self.addLibraryScore();

    //  Show the relevant end screen if there is no next library
    self.currentEndScreen = self.endScreens[id];

    if (nextLibrary === false) {
      // Custom end screen
      if (e.data.feedback) {
        const endScreen = createEndScreen({
          endScreenTitle: e.data.feedback.title,
          endScreenSubtitle: e.data.feedback.subtitle,
          endScreenImage: e.data.feedback.image,
          endScreenScore: e.data.feedback.endScreenScore
        });
        self.container.append(endScreen.getElement());
        self.currentEndScreen = endScreen;
      }
      else if (self.params.scoringOption === SCORE_TYPES.DYNAMIC_SCORE) {
        self.currentEndScreen.setScore(self.getScore());
      }

      self.libraryScreen.hide();
      self.currentEndScreen.show();
    }
    else {
      self.libraryScreen.showNextLibrary(nextLibrary);
      self.currentId = id;
    }
  });

  /**
   * Handle restarting
   */
  self.on('restarted', function() {
    self.triggerXAPIScored(null, null, 'answered', true); // TODO: decide on how score works
    self.currentEndScreen.hide();
    self.scores = [];
    self.startScreen.show();

    // Reset the library screen
    self.libraryScreen.remove();
    // Note: the first library must always have an id of 0
    self.libraryScreen = new H5P.BranchingScenario.LibraryScreen(self, params.title, self.getLibrary(0));

    self.libraryScreen.on('toggleFullScreen', () => {
      self.toggleFullScreen();
    });

    self.container.append(self.libraryScreen.getElement());
  });

  /**
   * Handle resizing, resizes child library
   */
  self.on('resize', function (event) {
    if (self.bubblingUpwards) {
      return; // Prevent sending the event back down
    }
    if (typeof self.libraryScreen === 'object'&& Object.keys(self.libraryScreen).length !== 0) {
      self.libraryScreen.resize(event);
    }
    self.changeLayoutToFitWidth();
  });

  /**
   * Toggle full screen
   */
  self.toggleFullScreen = function () {
    const fullScreenContainer = document.querySelector('.h5p-container.h5p-branching-scenario');

    const isFullScreen = H5P.isFullscreen
      || fullScreenContainer.classList.contains('h5p-fullscreen')
      || fullScreenContainer.classList.contains('h5p-semi-fullscreen');

    if (isFullScreen) {
      // Exit fullscreen
      if (H5P.exitFullScreen) {
        H5P.exitFullScreen();
      }
    }
    else {
      H5P.fullScreen(H5P.jQuery(fullScreenContainer), this);
    }

  };

  /**
   * Retrieve current library's score
   */
  self.addLibraryScore = function () {
    const libraryInstance = self.libraryScreen.currentLibraryInstance;

    // Skip branching questions (current id not matching library id)
    if (self.currentId !== self.libraryScreen.currentLibraryId) {
      return;
    }

    let currentLibraryScore = 0;
    if (libraryInstance && libraryInstance.getScore) {
      currentLibraryScore = libraryInstance.getScore();
    }

    // Update existing or create new entry
    let hasScore = false;
    self.scores.forEach(function (score) {
      if (score.id === self.currentId) {
        score.score = currentLibraryScore;
        hasScore = true;
      }
    });

    if (!hasScore) {
      self.scores.push({
        id: self.currentId,
        score: currentLibraryScore,
      });
    }
  };

  /**
   * Get accumulative score for all attempted scenarios
   */
  self.getScore = function () {
    return self.scores.reduce(function (previousValue, score) {
      return previousValue + score.score;
    }, 0);
  };

  /**
   * Change the width of the branching question depending on the container changeLayoutToFitWidth
   * @return {undefined} undefined
   */
  self.changeLayoutToFitWidth = function() {
    const fontSize = parseInt(window.getComputedStyle(document.getElementsByTagName('body')[0]).fontSize, 10);
    // Wide screen
    if (this.container.width() / fontSize > 43) {
      self.container[0].classList.add('h5p-wide-screen');
    }
    else {
      self.container[0].classList.add('h5p-mobile-screen');
    }
  };

  /**
   * Attach Branching Scenario to the H5P container
   *
   * @param  {HTMLElement} $container Container for the content type
   * @return {undefined} undefined
   */
  self.attach = function($container) {
    self.container = $container;
    $container.addClass('h5p-branching-scenario').html('');

    if (!params.content || params.content.length === 0) {
      const contentMessage = document.createElement('div');
      contentMessage.innerHTML = '<h1>I really need some content ;-)</h1>';
      self.container.append(contentMessage);
      return;
    }

    self.startScreen = createStartScreen(params.startScreen, true);
    self.container.append(self.startScreen.getElement());
    self.currentId = 0;

    // Note: the first library must always have an id of 0
    self.libraryScreen = new H5P.BranchingScenario.LibraryScreen(self, params.title, self.getLibrary(0));
    self.libraryScreen.on('toggleFullScreen', () => {
      self.toggleFullScreen();
    });
    self.container.append(self.libraryScreen.getElement());

    params.endScreens.forEach(endScreen => {
      self.endScreens[endScreen.contentId] = createEndScreen(endScreen);
      self.container.append(self.endScreens[endScreen.contentId].getElement());
    });
  };
};

H5P.BranchingScenario.prototype = Object.create(H5P.EventDispatcher.prototype);
H5P.BranchingScenario.prototype.constructor = H5P.BranchingScenario;
