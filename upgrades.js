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
      2: function (parameters, finished, extras) {
        // Sanitization
        parameters.branchingScenario = parameters.branchingScenario || {};
        parameters.branchingScenario.content = parameters.branchingScenario.content || [];

        // Individual require finished override value
        parameters.branchingScenario.content.forEach( function (contentNode) {
          // No setting required for Branching Question
          if (!contentNode.type || !contentNode.type.library || contentNode.type.library.split(' ')[0] === 'H5P.BranchingQuestion') {
            return;
          }

          // Mind the one-item behavior of semantics groups
          if (typeof contentNode.contentBehaviour === 'undefined') {
            contentNode.contentBehaviour = false;
          }
        });

        // Global require finished override select default value, mind the one-item behavior of semantics groups
        if (typeof parameters.branchingScenario.behaviour === 'undefined') {
          parameters.branchingScenario.behaviour = 'individual';
        }


        finished(null, parameters, extras);
      }
    }
  };
})();
