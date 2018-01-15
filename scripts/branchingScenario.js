H5P = H5P || {};

H5P.BranchingScenario = function (params, contentId) {
  const self = this;
  self.params = params;
  H5P.EventDispatcher.call(self);
  self.contentId = contentId;
  self.startScreen;
  self.libraryScreen;
  self.endScreens = {};
  self.navigating;
  self.currentHeight;
  self.currentId;

  /**
   * Create a start screen object
   *
   * @param  {string} {startScreenTitle
   * @param  {string} startScreenSubtitle
   * @param  {Object} startScreenImage}   Object containing image metadata
   * @param  {boolean} isCurrentScreen    When Branching Scenario is first initialized
   * @return {GenericScreen}              Generic Screen object
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
   * @param  {string} {endScreenTitle
   * @param  {string} endScreenSubtitle
   * @param  {Object} endScreenImage}   Object containing image metadata
   * @return {GenericScreen}            Generic Screen object
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
   * @param  {number} id
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

  self.on('started', function() {
    self.startScreen.hide();
    self.libraryScreen.show();
    self.triggerXAPI('progressed');
  });

  self.on('navigated', function(e) {
    self.trigger('resize');
    self.triggerXAPI('progressed');
    let id = e.data;
    let nextLibrary = self.getLibrary(id);

    if (nextLibrary === false) {
      self.libraryScreen.hide();
      self.currentEndScreen = self.endScreens[id];
      self.currentEndScreen.show();
    }
    else if (id === self.currentId) {
      self.libraryScreen.hideBranchingQuestion(nextLibrary);
    }
    else {
      self.libraryScreen.showNextLibrary(nextLibrary);
      if (nextLibrary.content.library.split(' ')[0] !== 'H5P.BranchingQuestion') {
        self.currentId = id;
      }
    }
  });

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

  self.on('resize', function (event) {
    if (self.bubblingUpwards) {
      return; // Prevent sending the event back down
    }
    self.libraryScreen.resize(event);
  });

  /**
   * Attach Branching Scenario to the H5P container
   *
   * @param  {HTMLElement} $container
   */
  self.attach = function($container) {
    self.container = $container;
    $container.addClass('h5p-branching-scenario').html('');

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
