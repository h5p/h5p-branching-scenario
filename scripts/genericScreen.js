H5P.BranchingScenario.GenericScreen = (function () {

  /**
   * GenericScreen constructor
   *
   * @param {BranchingScenario} parent BranchingScenario Object
   * @param {Object} screenData Object containing data required to construct the screen
   * @param {boolean} screenData.isStartScreen Determines if it is a starting screen
   * @param {string}  screenData.titleText Title
   * @param {string}  screenData.subtitleText Subtitle
   * @param {string}  screenData.scoreText Score text
   * @param {Object}  screenData.image Image object
   * @param {string}  screenData.buttonText Text for the button
   * @param {boolean} screenData.isCurrentScreen Determines if the screen is shown immediately
   * @param {number} screenData.score Score that should be displayed
   * @param {number} screenData.maxScore Max achievable score
   * @param {number} screenData.showScore Determines if score should be displayed
   *
   * @return {GenericScreen} A screen object
   */
  function GenericScreen(parent, screenData) {
    H5P.EventDispatcher.call(this);

    const self = this;
    self.parent = parent;
    self.isShowing = screenData.isStartScreen;
    self.screenWrapper = document.createElement('div');
    self.screenWrapper.classList.add(screenData.isStartScreen ? 'h5p-start-screen' : 'h5p-end-screen');
    self.screenWrapper.classList.add(screenData.isCurrentScreen ? 'h5p-current-screen' : 'h5p-next-screen');
    if (!screenData.isCurrentScreen) {
      this.screenWrapper.classList.add('h5p-branching-hidden');
    }
    else {
      self.parent.currentHeight = '45em';
    }

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('h5p-branching-scenario-screen-content');

    var feedbackText = document.createElement('div');
    feedbackText.classList.add('h5p-feedback-content-content');
    contentDiv.appendChild(feedbackText);

    const title = document.createElement('h1');
    title.className = 'h5p-branching-scenario-title-text';
    title.innerHTML = screenData.titleText;

    const subtitle = document.createElement('div');
    subtitle.className = 'h5p-branching-scenario-subtitle-text';
    subtitle.innerHTML = screenData.subtitleText;

    const navButton = document.createElement('button');
    navButton.classList.add(screenData.isStartScreen ? 'h5p-start-button' : 'h5p-end-button');
    navButton.classList.add('transition');

    navButton.onclick = function () {
      screenData.isStartScreen ? self.parent.trigger('started') : self.parent.trigger('restarted');
      self.parent.navigating = true;
    };

    self.navButton = navButton;

    const buttonTextNode = document.createTextNode(screenData.buttonText);
    navButton.appendChild(buttonTextNode);

    feedbackText.appendChild(title);
    feedbackText.appendChild(subtitle);
    contentDiv.appendChild(navButton);

    if (screenData.showScore && screenData.score !== undefined) {
      self.scoreWrapper = this.createResultContainer(
        screenData.scoreText,
        screenData.score,
        screenData.maxScore
      );
      contentDiv.insertBefore(self.scoreWrapper, contentDiv.firstChild);
    }

    if (H5P.canHasFullScreen) {
      const fullScreenButton = document.createElement('button');
      fullScreenButton.className = 'h5p-branching-full-screen';
      fullScreenButton.addEventListener('click', () => {
        this.trigger('toggleFullScreen');
      });
      self.screenWrapper.appendChild(fullScreenButton);
    }

    self.screenWrapper.appendChild(
      self.createScreenBackground(screenData.isStartScreen, screenData.image)
    );
    self.screenWrapper.appendChild(contentDiv);

    /**
     * Get score for screen
     *
     * @return score
     */
    self.getScore = function () {
      return screenData.score;
    };
  }

  /**
   * Returns the wrapping div
   *
   * @return {HTMLElement} Wrapper
   */
  GenericScreen.prototype.getElement = function () {
    return this.screenWrapper;
  };

  /**
   * Set score for screen
   *
   * @param score
   */
  GenericScreen.prototype.setScore = function (score) {
    if (this.scoreValue && score !== undefined) {
      this.scoreValue.textContent = score.toString();
    }
  };

  /**
   * Creates a wrapper containing the score. Not in use!
   *
   * @param  {string} scoreLabel Score label
   * @param  {number} score Score to be shown
   * @param  {number} [maxScore] Max achievable score
   * @return {HTMLElement} Result container
   */
  GenericScreen.prototype.createResultContainer = function (scoreLabel, score, maxScore) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('h5p-result-wrapper');

    const resultContainer = document.createElement('div');
    resultContainer.classList.add('h5p-result-container');

    const scoreText = document.createElement('div');
    scoreText.classList.add('h5p-score-text');
    scoreText.appendChild(document.createTextNode(scoreLabel));

    const scoreCircle = document.createElement('div');
    scoreCircle.classList.add('h5p-score-circle');

    const achievedScore = document.createElement('span');
    achievedScore.className = 'h5p-score-value';
    this.scoreValue = document.createTextNode(score.toString());
    achievedScore.appendChild(this.scoreValue);

    scoreCircle.appendChild(achievedScore);

    if (maxScore && maxScore > 0) {
      const scoreDelimiter = document.createElement('span');
      scoreDelimiter.className = 'h5p-score-delimiter';
      scoreDelimiter.textContent = '/';
      scoreCircle.appendChild(scoreDelimiter);

      const maxAchievableScore = document.createElement('span');
      maxAchievableScore.className = 'h5p-max-score';
      maxAchievableScore.textContent = maxScore.toString();
      scoreCircle.appendChild(maxAchievableScore);
    }

    resultContainer.appendChild(scoreText);
    resultContainer.appendChild(scoreCircle);
    wrapper.appendChild(resultContainer);
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
    backgroundImage.addEventListener('load', () => {
      this.parent.trigger('resize');
    });

    backgroundWrapper.appendChild(backgroundBanner);
    backgroundWrapper.appendChild(backgroundImage);

    return backgroundWrapper;
  };

  /**
   * Slides the screen in and styles it as the current screen
   * @return {undefined}
   */
  GenericScreen.prototype.show = function () {
    const self = this;
    self.isShowing = true;
    self.screenWrapper.classList.add('h5p-slide-in');
    self.screenWrapper.classList.remove('h5p-branching-hidden');

    // Style as the current screen
    self.screenWrapper.addEventListener('animationend', function (event) {
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
    self.isShowing = false;
    self.screenWrapper.classList.add('h5p-slide-out');

    // Style as hidden
    self.screenWrapper.addEventListener('animationend', function (event) {
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
