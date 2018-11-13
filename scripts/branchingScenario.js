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
      startScreenTitle: "",
      startScreenSubtitle: ""
    },
    endScreens: [
      {
        endScreenTitle: "",
        endScreenSubtitle: "",
        contentId: -1
      }
    ],
    scoringOption: 'static-end-score',
    l10n: {}
  }, params.branchingScenario); // Account for the wrapper!

  // Set default localization
  params.l10n = extend({
    startScreenButtonText: "Start the course",
    endScreenButtonText: "Restart the course",
    proceedButtonText: "Proceed",
    scoreText: "Your score:"
  }, params.l10n);

  // Sanitize the (next)ContentIds that the editor didn't set
  params.content.forEach((item, index) => {
    item.contentId = index;
    if (item.nextContentId === undefined) {
      item.nextContentId = -1;
    }
  });

  self.params = params;
  self.scoring = new H5P.BranchingScenario.Scoring(params);

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
  const createStartScreen = function ({startScreenTitle, startScreenSubtitle, startScreenImage}, isCurrentScreen) {
    const startScreen = new H5P.BranchingScenario.GenericScreen(self, {
      isStartScreen: true,
      titleText: startScreenTitle,
      subtitleText: startScreenSubtitle,
      image: startScreenImage,
      buttonText: params.l10n.startScreenButtonText,
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
    const endScreen = new H5P.BranchingScenario.GenericScreen(self, {
      isStartScreen: false,
      titleText: endScreenData.endScreenTitle,
      subtitleText: endScreenData.endScreenSubtitle,
      image: endScreenData.endScreenImage,
      buttonText: params.l10n.endScreenButtonText,
      isCurrentScreen: false,
      scoreText: params.l10n.scoreText,
      score: self.scoring.getScore(endScreenData.endScreenScore),
      maxScore: self.scoring.getMaxScore(),
      showScore: self.scoring.shouldShowScore(),
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
  self.getLibrary = function (id) {
    return (params.content[id] !== undefined ? params.content[id] : false);
  };

  /**
   * Handle the start of the branching scenario
   */
  self.on('started', function () {
    const startNode = this.params.content[0];
    if (startNode && startNode.type && startNode.type.library && startNode.type.library.split(' ')[0] === 'H5P.BranchingQuestion') {
      // First node is Branching Question, no sliding, just trigger BQ overlay
      self.trigger('navigated', {
        nextContentId: 0
      });
    }
    else {
      // First node is info content
      self.startScreen.hide();
      self.libraryScreen.show();
      self.triggerXAPI('progressed');
    }
    self.currentId = 0;
  });

  /**
   * Handle progression
   */
  self.on('navigated', function (e) {
    // Remove any feedback dialogs
    self.libraryScreen.hideFeedbackDialogs();

    self.trigger('resize');
    self.triggerXAPI('progressed');
    const id = e.data.nextContentId;
    const nextLibrary = self.getLibrary(id);
    self.scoring.addLibraryScore(
      this.currentId,
      this.libraryScreen.currentLibraryId,
      e.data.chosenAlternative
    );

    //  Show the relevant end screen if there is no next library
    self.currentEndScreen = self.endScreens[id];

    if (nextLibrary === false) {
      // Custom end screen
      if (e.data.feedback) {
        const endScreen = createEndScreen({
          endScreenTitle: e.data.feedback.title || '',
          endScreenSubtitle: e.data.feedback.subtitle || '',
          endScreenImage: e.data.feedback.image,
          endScreenScore: e.data.feedback.endScreenScore
        });
        self.$container.append(endScreen.getElement());
        self.currentEndScreen = endScreen;
      }
      else if (self.scoring.isDynamicScoring()) {
        self.currentEndScreen.setScore(self.getScore());
      }

      self.startScreen.hide();
      self.libraryScreen.hide();
      self.currentEndScreen.show();
    }
    else {
      self.libraryScreen.showNextLibrary(nextLibrary);
      self.currentId = id;
    }

    // First node was BQ, so sliding from start screen to library screen is needed now
    if (e.data.nextContentId !== 0 && document.querySelector('.h5p-start-screen').classList.contains('h5p-current-screen')) {
      // Remove translation of info content which would tamper with timing of sliding
      const wrapper = self.libraryScreen.wrapper.querySelector('.h5p-slide-in');
      if (wrapper) {
        wrapper.classList.remove('h5p-next');
        self.startScreen.hide();
        self.libraryScreen.show();
      }
    }
  });

  /**
   * Handle restarting
   */
  self.on('restarted', function () {
    self.triggerXAPIScored(null, null, 'answered', true); // TODO: decide on how score works
    self.currentEndScreen.hide();
    self.scoring.restart();
    self.startScreen.screenWrapper.classList.remove('h5p-slide-out');
    self.startScreen.show();

    // Reset the library screen
    self.libraryScreen.remove();
    // Note: the first library must always have an id of 0
    self.libraryScreen = new H5P.BranchingScenario.LibraryScreen(self, params.startScreen.startScreenTitle, self.getLibrary(0));

    self.libraryScreen.on('toggleFullScreen', () => {
      self.toggleFullScreen();
    });

    self.$container.append(self.libraryScreen.getElement());
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
    if (self.isFullScreen()) {
      // Exit fullscreen
      if (H5P.exitFullScreen) {
        H5P.exitFullScreen();
      }
    }
    else {
      H5P.fullScreen(self.$container, this);
    }

  };

  /**
   * Returns true if we're in full screen or semi full screen.
   *
   * @returns {boolean}
   */
  self.isFullScreen = function () {
    return H5P.isFullscreen
      || (self.$container
        && self.$container[0].classList.contains('h5p-fullscreen'))
      ||(self.$container
        && self.$container[0].classList.contains('h5p-semi-fullscreen'));
  };

  /**
   * Get accumulative score for all attempted scenarios
   *
   * @returns {number} Current score for Brnaching Scenario
   */
  self.getScore = function () {
    return self.scoring.getScore();
  };

  /**
   * Get max score
   *
   * @returns {number} Max score for branching scenario
   */
  self.getMaxScore = function () {
    return self.scoring.getMaxScore();
  };

  /**
   * Change the width of the branching question depending on the container changeLayoutToFitWidth
   * @return {undefined} undefined
   */
  self.changeLayoutToFitWidth = function () {
    const fontSize = parseInt(window.getComputedStyle(document.getElementsByTagName('body')[0]).fontSize, 10);
    // Wide screen
    if (this.$container.width() / fontSize > 43) {
      self.$container[0].classList.add('h5p-wide-screen');
    }
    else {
      self.$container[0].classList.add('h5p-mobile-screen');
    }
  };

  /**
   * Attach Branching Scenario to the H5P container
   *
   * @param  {HTMLElement} $container Container for the content type
   * @return {undefined} undefined
   */
  self.attach = function ($container) {
    self.$container = $container;
    $container.addClass('h5p-branching-scenario').html('');

    if (!params.content || params.content.length === 0) {
      const contentMessage = document.createElement('div');
      contentMessage.innerHTML = '<h1>I really need some content ;-)</h1>';
      self.$container.append(contentMessage);
      return;
    }

    self.startScreen = createStartScreen(params.startScreen, true);
    self.$container.append(self.startScreen.getElement());
    self.currentId = 0;

    // Note: the first library must always have an id of 0
    self.libraryScreen = new H5P.BranchingScenario.LibraryScreen(self, params.startScreen.startScreenTitle, self.getLibrary(0));
    self.libraryScreen.on('toggleFullScreen', () => {
      self.toggleFullScreen();
    });
    self.$container.append(self.libraryScreen.getElement());

    params.endScreens.forEach(endScreen => {
      self.endScreens[endScreen.contentId] = createEndScreen(endScreen);
      self.$container.append(self.endScreens[endScreen.contentId].getElement());
    });
  };
};

H5P.BranchingScenario.prototype = Object.create(H5P.EventDispatcher.prototype);
H5P.BranchingScenario.prototype.constructor = H5P.BranchingScenario;
