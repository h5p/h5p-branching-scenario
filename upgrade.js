var H5PUpgrades = H5PUpgrades || {};

H5PUpgrades['H5P.BranchingScenario'] = (function () {
  return {
    1: {
      /**
       * Asynchronous content upgrade hook.
       *
       * Add new default parameters.
       *
       * @param {Object} parameters
       * @param {function} finished
       */
      1: function (parameters, finished, extras) {
        parameters.behaviour = {
          enableBackButton: false
        };

        if (parameters.l10n) {
          parameters.l10n.backButtonText = 'Text for the back button on each of the library screens and branching questions';
        }

        finished(null, parameters, extras);
      }
    }
  };
})();
