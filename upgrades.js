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
      4: function (parameters, finished, extras) {
        // Sanitization
        parameters.branchingScenario = parameters.branchingScenario || {};
        parameters.branchingScenario.content = parameters.branchingScenario.content || [];
        parameters.branchingScenario.behaviour = parameters.branchingScenario.behaviour || {};

        // Set behvaior paramter for each content
        parameters.branchingScenario.content.forEach( function (contentNode) {
          if (!contentNode.contentBehaviour) {
            contentNode.contentBehaviour = "useBehavioural";
          }
          if (!contentNode.forceContentFinished) {
            contentNode.forceContentFinished = "useBehavioural";
          }
        });

        // Global backwards navigation default value
        if (!parameters.branchingScenario.behaviour.enableBackwardsNavigation) {
          parameters.branchingScenario.behaviour.enableBackwardsNavigation = false;
        }

        if (!parameters.branchingScenario.behaviour.forceContentFinished) {
          parameters.branchingScenario.behaviour.forceContentFinished = false;
        }

        finished(null, parameters, extras);
      },
  }
  };
})();
