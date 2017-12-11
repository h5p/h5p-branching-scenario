H5P.BranchingScenario.GenericScreen = (function() {

  function GenericScreen(parent, {isStartScreen, titleText, subtitleText, image, buttonText, isCurrentScreen}) {
    this.parent = parent;
    this.screenWrapper = document.createElement('div');
    this.screenWrapper.classList.add(isStartScreen ? 'h5p-start-screen' : 'h5p-end-screen');
    this.screenWrapper.classList.add(isCurrentScreen ? 'h5p-current-screen' : 'h5p-next-screen');

    var contentDiv = document.createElement('div');
    contentDiv.classList.add('h5p-branching-scenario-screen-content');

    var title = document.createElement('h1');
    title.className = 'h5p-branching-scenario-title-text';
    title.innerHTML = titleText;

    var subtitle = document.createElement('h2');
    subtitle.className = 'h5p-branching-scenario-subtitle-text';
    subtitle.innerHTML = subtitleText;

    var navButton = document.createElement('button');
    navButton.classList.add(isStartScreen ? 'h5p-start-button' : 'h5p-end-button');

    var self = this;
    navButton.onclick = function() {
      isStartScreen ? self.parent.trigger('started') : self.parent.trigger('restarted');
    };

    var buttonTextNode = document.createTextNode(buttonText);
    navButton.append(buttonTextNode);

    contentDiv.append(title);
    contentDiv.append(subtitle);
    contentDiv.append(navButton);

    if (isStartScreen === false) {
      contentDiv.prepend(this.createResultContainer(121232));
    }

    this.screenWrapper.append(this.createScreenBackground(isStartScreen, image));
    this.screenWrapper.append(contentDiv);
  }

  GenericScreen.prototype.getElement = function() {
    return this.screenWrapper;
  };

  GenericScreen.prototype.createResultContainer = function(score) {
    var wrapper = document.createElement('div');
    wrapper.classList.add('h5p-result-wrapper');

    var resultContainer = document.createElement('div');
    resultContainer.classList.add('h5p-result-container');

    var scoreText = document.createElement('div');
    scoreText.classList.add('h5p-score-text');
    scoreText.append(document.createTextNode('Your score: '));

    var scoreCircle = document.createElement('div');
    scoreCircle.classList.add('h5p-score-circle');
    scoreCircle.append(document.createTextNode(score));

    resultContainer.append(scoreText);
    resultContainer.append(scoreCircle);
    wrapper.append(resultContainer);
    return wrapper;
  };

  GenericScreen.prototype.createScreenBackground = function (isStartScreen, image) {
    var backgroundWrapper = document.createElement('div');
    backgroundWrapper.classList.add('h5p-screen-background');

    var backgroundBanner = document.createElement('div');
    backgroundBanner.classList.add('h5p-screen-banner');

    var backgroundImage = document.createElement('img');
    backgroundImage.classList.add('h5p-background-image');

    if (image && image.path) {
      backgroundImage.src = H5P.getPath(image.path, this.parent.contentId);
    }
    else {
      backgroundImage.src = isStartScreen ? this.parent.getLibraryFilePath('assets/start-screen-default.jpg') : this.parent.getLibraryFilePath('assets/end-screen-default.jpg');
    }

    backgroundWrapper.append(backgroundBanner);
    backgroundWrapper.append(backgroundImage);

    return backgroundWrapper;
  };

  GenericScreen.prototype.show = function () {
    var self = this;
    self.screenWrapper.classList.add('h5p-slide-in');

    // Style as the current screen
    self.screenWrapper.addEventListener('animationend', function() {
      self.screenWrapper.classList.remove('h5p-next-screen');
      self.screenWrapper.classList.remove('h5p-slide-in');
      self.screenWrapper.classList.add('h5p-current-screen');
    });
  };

  GenericScreen.prototype.hide = function () {
    var self = this;
    self.screenWrapper.classList.add('h5p-slide-out');

    self.screenWrapper.addEventListener('animationend', function() {
      self.screenWrapper.classList.remove('h5p-current-screen');
      self.screenWrapper.classList.add('h5p-next-screen');
      self.screenWrapper.classList.remove('h5p-slide-out');
    });
  };

  return GenericScreen;
})();
