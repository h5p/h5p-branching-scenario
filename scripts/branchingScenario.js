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

  // Sanitize the nextContentIds that the editor didn't set
  params.content.forEach(item => {
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
   * @return {GenericScreen} Generic Screen object
   */
  const createStartScreen = function({startScreenTitle, startScreenSubtitle, startScreenImage}, isCurrentScreen) {
    return new H5P.BranchingScenario.GenericScreen(self, {
      isStartScreen: true,
      titleText: startScreenTitle,
      subtitleText: startScreenSubtitle,
      image: startScreenImage,
      buttonText: params.startScreenButtonText,
      isCurrentScreen
    });
  };

  /**
   * Create an end screen object
   *
   * @param  {Object} endscreendata Object containing data needed to build an end screen
   * @param  {string} endscreendata.endScreenTitle Title
   * @param  {string} endscreendata.endScreenSubtitle Subtitle
   * @param  {Object} endscreendata.endScreenImage Object containing image metadata
   * @return {GenericScreen} Generic Screen object
   */
  const createEndScreen = function({endScreenTitle, endScreenSubtitle, endScreenImage}) {
    return new H5P.BranchingScenario.GenericScreen(self, {
      isStartScreen: false,
      titleText: endScreenTitle,
      subtitleText: endScreenSubtitle,
      image: endScreenImage,
      buttonText: params.endScreenButtonText,
      isCurrentScreen: false
    });
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
    const id = e.data;
    const nextLibrary = self.getLibrary(id);

    //  Show the relevant end screen if there is no next library
    if (nextLibrary === false) {
      self.libraryScreen.hide();
      self.currentEndScreen = self.endScreens[id];
      self.currentEndScreen.show();
    }
    else if (id === self.currentId) { // Hide branching question if it's the same library
      self.libraryScreen.hideBranchingQuestion(nextLibrary);
    }
    else {
      self.libraryScreen.showNextLibrary(nextLibrary);
      // Only update the id for non-branching questions
      if (nextLibrary.type.library.split(' ')[0] !== 'H5P.BranchingQuestion') {
        self.currentId = id;
      }
    }
  });

  /**
   * Handle restarting
   */
  self.on('restarted', function() {
    self.triggerXAPIScored(null, null, 'answered', true); // TODO: decide on how score works
    self.currentEndScreen.hide();
    self.startScreen.show();

    // Reset the library screen
    self.libraryScreen.remove();
    // Note: the first library must always have an id of 0
    self.libraryScreen = new H5P.BranchingScenario.LibraryScreen(self, params.title, self.getLibrary(0));
    self.container.append(self.libraryScreen.getElement());
  });

  /**
   * Handle resizing, resizes child library
   */
  self.on('resize', function (event) {
    if (self.bubblingUpwards) {
      return; // Prevent sending the event back down
    }
    if (self.libraryScreen === Object && Object.keys(self.libraryScreen).length !== 0) {
      self.libraryScreen.resize(event);
    }
    self.changeLayoutToFitWidth();
  });

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
    self.container.append(self.libraryScreen.getElement());

    params.endScreens.forEach(endScreen => {
      self.endScreens[endScreen.contentId] = createEndScreen(endScreen);
      self.container.append(self.endScreens[endScreen.contentId].getElement());
    });
  };
};

H5P.BranchingScenario.prototype = Object.create(H5P.EventDispatcher.prototype);
H5P.BranchingScenario.prototype.constructor = H5P.BranchingScenario;
