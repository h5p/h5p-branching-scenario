H5P.BranchingScenario.GenericScreen = (function() {

  /**
   * GenericScreen constructor
   *
   * @param {BranchingScenario} parent BranchingScenario Object
   * @param {Object} ScreenData Object containing data required to construct the screen
   * @param {boolean} ScreenData.isStartScreen Determines if it is a starting screen
   * @param {string}  ScreenData.titleText Title
   * @param {string}  ScreenData.subtitleText Subtitle
   * @param {Object}  ScreenData.image Image object
   * @param {string}  ScreenData.buttonText Text for the button
   * @param {boolean} ScreenData.isCurrentScreen Determines if the screen is shown immediately
   * @return {GenericScreen} A screen object
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
    navButton.classList.add('transition');

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
      // This is how the scoring div should be added: contentDiv.prepend(this.createResultContainer(12));
    }

    self.screenWrapper.append(self.createScreenBackground(isStartScreen, image));
    self.screenWrapper.append(contentDiv);
  }

  /**
   * Returns the wrapping div
   *
   * @return {HTMLElement} Wrapper
   */
  GenericScreen.prototype.getElement = function() {
    return this.screenWrapper;
  };

  /**
   * Creates a wrapper containing the score. Not in use!
   *
   * @param  {number} score Score to be shown
   * @return {HTMLElement} Result container
   */
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

  /**
   * Creates the background for the screen
   *
   * @param  {boolean} isStartScreen Determines if the screen is a starting screen
   * @param  {Object} image Image object
   * @return {HTMLElement} Wrapping div for the background
   */
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
   * @return {undefined}
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
   * @return {undefined}
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
