function onRun(context) {
    sketch = context.api();
    //[[[NSSpellChecker sharedSpellChecker] spellingPanel] makeKeyAndOrderFront:nil] //This opens the spelling panel, but isn't usable as of now.
    //log([[NSSpellChecker sharedSpellChecker] spellingPanel])
    var doc = context.document
      // Filter layers using NSPredicate
    	var scope = (typeof containerLayer !== 'undefined') ? [containerLayer children] : [[doc currentPage] children],
    		predicate = NSPredicate.predicateWithFormat("(className == %@)", "MSTextLayer"),
    		layers = [scope filteredArrayUsingPredicate:predicate];

    	// Deselect current selection
    	[[doc currentPage] deselectAllLayers]

    	// Loop through filtered layers and select them
    	var loop = [layers objectEnumerator], layer;
      var allWords = "";
      var misspellingcount = 0;
      while (layer = [loop nextObject]) {
        //do spellcheck on each layer
            var aString = [layer stringValue]
            range = [[NSSpellChecker sharedSpellChecker] checkSpellingOfString:aString startingAt:0];
            if(range.length >0){
              //Select the layer
              [layer select:true byExpandingSelection:true]

              var misSpelledWord = aString.substring(range.location, (range.location+range.length))
              allWords = allWords+"\nText: "+aString+"\nMisspelled Word: "+misSpelledWord+"\n";
              misspellingcount ++;
              //[[NSSpellChecker sharedSpellChecker] updateSpellingPanelWithMisspelledWord:misSpelledWord] // Updates the spell checker window with the misspelled word. Since we can't update the text yet, this isn't helpful, so it's commented out.

              //NOTE: There's a possibility we could use the getSelectionFromUser method from the Sketch Javascript API to give a list of options such as "skip, add to dictionary, replace with..."
              //Documetntation here: http://developer.sketchapp.com/reference/api/class/api/Application.js~Application.html#instance-method-alert
            }

    	}
      //Builds our little alert
      //allWords = allWords + "\nFound "+misspellingcount+" misspellings in "+[layers count]+" text layers";
      //[[NSApplication sharedApplication] displayDialog:allWords withTitle:"Spellcheck Whole Page"]
      sketch.alert("Found "+misspellingcount+" misspellings in "+[layers count]+" text layers", allWords)
}
