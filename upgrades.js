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
        parameters.branchingScenario.behaviour = false;

        if (parameters.branchingScenario.l10n) {
          parameters.branchingScenario.l10n.backButtonText = 'Back';
        }

        finished(null, parameters, extras);
      }
    }
  };
})();
