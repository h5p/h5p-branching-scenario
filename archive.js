if (nextLibrary.content.library === 'H5P.BranchingQuestion 1.0') {
  // Load all the next screens after the branching question ahead of time
  let temp = nextLibrary.content.params.answers
    .map(answer => {
      let id = answer.nextContentId;

      if (id === -1) {
        let libraryScreen = createEndScreen();
        return { id, libraryScreen }
      }

      let libraryScreen = createLibraryScreen(getLibrary(id));
      return { id,  libraryScreen }
    });
  temp.forEach(function(el) {
    nextScreens[el.id] = el.libraryScreen;
  })

  currentScreen.append(createBranchingQuestion(nextLibrary));
}
