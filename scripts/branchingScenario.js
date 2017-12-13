H5P = H5P || {};

H5P.BranchingScenario = function (params, contentId) {
  var self = this;
  self.params = params;
  H5P.EventDispatcher.call(self);
  self.contentId = contentId;
  self.startScreen;
  self.libraryScreen;
  self.endScreen;

  var createStartScreen = function({startScreenTitle, startScreenSubtitle, startScreenImage}, isCurrentScreen) {
    return new H5P.BranchingScenario.GenericScreen(self, {
      isStartScreen: true,
      titleText: startScreenTitle,
      subtitleText: startScreenSubtitle,
      image: startScreenImage,
      buttonText: params.startScreenButtonText,
      isCurrentScreen
    });
  };

  var createEndScreen = function({endScreenTitle, endScreenSubtitle, endScreenImage}) {
    return new H5P.BranchingScenario.GenericScreen(self, {
      isStartScreen: false,
      titleText: endScreenTitle,
      subtitleText: endScreenSubtitle,
      image: endScreenImage,
      buttonText: params.endScreenButtonText,
      isCurrentScreen: false
    });
  };

  self.getLibrary = function(id) {
    for (var i = 0; i < params.content.length; i ++) {
      if (params.content[i].contentId === id) {
        return params.content[i];
      }
    }
    return -1;
  };

  self.on('started', function() {
    self.startScreen.hide();
    self.libraryScreen.show();
  });

  self.on('navigated', function(e) {
    self.trigger('resize');
    var nextLibrary = self.getLibrary(e.data);

    if (nextLibrary === -1) { // -1 refers to the end screen
      self.libraryScreen.hide();
      self.endScreen.show();
    }
    else {
      self.libraryScreen.showNextLibrary(nextLibrary);
    }
  });

  self.on('restarted', function() {
    self.endScreen.hide();
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

  self.attach = function($container) {
    self.container = $container;
    $container.addClass('h5p-branching-scenario').html('');

    self.startScreen = createStartScreen(params.startscreen, true);
    self.container.append(self.startScreen.getElement());

    // Note: the first library must always have an id of 0
    self.libraryScreen = new H5P.BranchingScenario.LibraryScreen(self, params.title, self.getLibrary(0));
    self.container.append(self.libraryScreen.getElement());

    self.endScreen = createEndScreen(params.endscreen);
    self.container.append(self.endScreen.getElement());
  };
};

H5P.BranchingScenario.prototype = Object.create(H5P.EventDispatcher.prototype);
H5P.BranchingScenario.prototype.constructor = H5P.BranchingScenario;
