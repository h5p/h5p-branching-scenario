H5P.BranchingScenario.GenericScreen = (function() {

  /**
   * GenericScreen constructor
   *
   * @param  {BranchingScenario} parent BranchingScenario Object
   * @param  {boolean} {isStartScreen
   * @param  {string}   titleText
   * @param  {string}   subtitleText
   * @param  {Object}   image
   * @param  {string}   buttonText
   * @param  {boolean}  isCurrentScreen}
   * @return {GenericScreen}
   */
  function GenericScreen(parent, {isStartScreen, titleText, subtitleText, image, buttonText, isCurrentScreen}) {
    const self = this;
    self.parent = parent;
    self.screenWrapper = document.createElement('div');
    self.screenWrapper.classList.add(isStartScreen ? 'h5p-start-screen' : 'h5p-end-screen');
    self.screenWrapper.classList.add(isCurrentScreen ? 'h5p-current-screen' : 'h5p-next-screen');
    if (!isCurrentScreen) {
      this.screenWrapper.classList.add('h5p-branching-hidden');
    }
    else {
      self.parent.currentHeight = '45em';
    }

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('h5p-branching-scenario-screen-content');

    const title = document.createElement('h1');
    title.className = 'h5p-branching-scenario-title-text';
    title.innerHTML = titleText;

    const subtitle = document.createElement('h2');
    subtitle.className = 'h5p-branching-scenario-subtitle-text';
    subtitle.innerHTML = subtitleText;

    const navButton = document.createElement('button');
    navButton.classList.add(isStartScreen ? 'h5p-start-button' : 'h5p-end-button');

    navButton.onclick = function() {
      isStartScreen ? self.parent.trigger('started') : self.parent.trigger('restarted');
      self.parent.navigating = true;
    };

    self.navButton = navButton;

    const buttonTextNode = document.createTextNode(buttonText);
    navButton.append(buttonTextNode);

    contentDiv.append(title);
    contentDiv.append(subtitle);
    contentDiv.append(navButton);

    if (isStartScreen === false) {
      // TODO: decide on how scoring should work and show score counter accordingly
      // contentDiv.prepend(this.createResultContainer(12));
    }

    self.screenWrapper.append(self.createScreenBackground(isStartScreen, image));
    self.screenWrapper.append(contentDiv);
  }

  GenericScreen.prototype.getElement = function() {
    return this.screenWrapper;
  };

  GenericScreen.prototype.createResultContainer = function(score) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('h5p-result-wrapper');

    const resultContainer = document.createElement('div');
    resultContainer.classList.add('h5p-result-container');

    const scoreText = document.createElement('div');
    scoreText.classList.add('h5p-score-text');
    scoreText.append(document.createTextNode('Your score: '));

    const scoreCircle = document.createElement('div');
    scoreCircle.classList.add('h5p-score-circle');
    scoreCircle.append(document.createTextNode(score));

    resultContainer.append(scoreText);
    resultContainer.append(scoreCircle);
    wrapper.append(resultContainer);
    return wrapper;
  };

  GenericScreen.prototype.createScreenBackground = function (isStartScreen, image) {
    const backgroundWrapper = document.createElement('div');
    backgroundWrapper.classList.add('h5p-screen-background');

    const backgroundBanner = document.createElement('div');
    backgroundBanner.classList.add('h5p-screen-banner');

    const backgroundImage = document.createElement('img');
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


  /**
   * Slides the screen in and styles it as the current screen
   */
  GenericScreen.prototype.show = function () {
    const self = this;
    self.screenWrapper.classList.add('h5p-slide-in');
    self.screenWrapper.classList.remove('h5p-branching-hidden');

    // Style as the current screen
    self.screenWrapper.addEventListener('animationend', function(event) {
      if (event.animationName === 'slide-in') {
        self.screenWrapper.classList.remove('h5p-next-screen');
        self.screenWrapper.classList.remove('h5p-slide-in');
        self.screenWrapper.classList.add('h5p-current-screen');
        self.parent.trigger('resize');
        self.navButton.focus();
      }
    });
  };

  /**
   * Slides the screen out and styles it to be hidden
   */
  GenericScreen.prototype.hide = function () {
    const self = this;
    self.screenWrapper.classList.add('h5p-slide-out');

    // Style as hidden
    self.screenWrapper.addEventListener('animationend', function(event) {
      if (event.animationName === 'slide-out') {
        self.screenWrapper.classList.add('h5p-branching-hidden');
        self.screenWrapper.classList.remove('h5p-current-screen');
        self.screenWrapper.classList.add('h5p-next-screen');
        self.screenWrapper.classList.remove('h5p-slide-out');
      }
    });
  };

  return GenericScreen;
})();
