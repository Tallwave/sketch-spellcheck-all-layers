@import 'sketch-nibui.js';

function onRun(context) {
  var sketch = context.api();
  var doc = context.document;
  var app = NSApplication.sharedApplication();

  // Filter layers using NSPredicate
	var scope = (typeof containerLayer !== 'undefined') ? [containerLayer children] : [[doc currentPage] children],
		predicate = NSPredicate.predicateWithFormat("(className == %@)", "MSTextLayer"),
		layers = [scope filteredArrayUsingPredicate:predicate]

	// Deselect current selection
	//[[doc currentPage] deselectAllLayers]
  // context.selection.clear();

	// Loop through filtered layers and select them
	var loop = [layers objectEnumerator], layer;
  var misspellingcount = 0;
  var stopChecking = false;
  while (layer = [loop nextObject]) {
    if(stopChecking){
      break; //If the user hits "Done", stop checking
    }

    //do spellcheck on each layer
    var aString = [layer stringValue]
    var spellingResult = spellcheckThis(aString, context);
    //Do text replacement if we updated anything
    if (spellingResult.madeAChange){
      //Select the layer just for display purposes
      [layer select:true byExpandingSelection:false]
      //Actually make the changes
      layer.setIsEditingText(true);
      layer.setStringValue(spellingResult.corrected);
      layer.setIsEditingText(false);
    }
    stopChecking = spellingResult.stopChecking;
    misspellingcount = misspellingcount + spellingResult.misspellingcount;

  }
  if(!stopChecking){
    var allSymbols = context.document.documentData().allSymbols();
    for (var i = 0; i < allSymbols.count(); i++) {
      var symbol = allSymbols[i];
      var instances = symbol.allInstances()
      for (var j = 0; j < instances.count(); j++){
        var overrides = instances[j].overrides();
        var madeAChange = false;
        if(overrides){
          var mutableOverrides = NSMutableDictionary.dictionaryWithDictionary(overrides);
          for( var l = 0; l< mutableOverrides.allKeys().count(); l++){
            thisID = mutableOverrides.allKeys()[l];
            if ( mutableOverrides[thisID].className().indexOf('String')>=0){
              //WHERE THE MAGIC HAPPENS! WE'VE FOUND A STRING!
              var spellingResult = spellcheckThis(mutableOverrides[thisID], context);
              //Do text replacement if we updated anything
              if (spellingResult.madeAChange){
                madeAChange = true;
                // Update the mutable dictionary -- Basically, these are temporary object copies that we can make changes to, then apply them over the actual "immutable" overrides
                mutableOverrides.setObject_forKey(spellingResult.corrected,thisID);
              }
              stopChecking = spellingResult.stopChecking;
              misspellingcount = misspellingcount + spellingResult.misspellingcount;
              if(stopChecking){
                //If the user hits "Done", stop checking--set all the for variables to their exit conditions
                j=instances.count();
                k=mutableOverrides.count();
                l=mutableOverrides.allKeys().count();
              }
            }
          }
        }
        // apply the overrides to the symbol instance
        if (madeAChange){
          // apply the overrides to the symbol instance
          instances[j].overrides = mutableOverrides;
        }
      }
    }
  }

  if (misspellingcount == 0){
    doc.displayMessage("No Misspellings here!");
  } else if (misspellingcount == 1 ){
    doc.displayMessage(misspellingcount+ " misspelling found!");
  } else {
    doc.displayMessage(misspellingcount+ " misspellings found!");
  }

}

function spellcheckThis( aString, context ){
  var language = [[NSSpellChecker sharedSpellChecker] language]
  var app = NSApplication.sharedApplication();
  var stopChecking = false;
  var misspellingcount = 0;
  var madeAChange=false;
  var range = [[NSSpellChecker sharedSpellChecker] checkSpellingOfString:aString startingAt:0];
  while(range.length >0 ){
    var cursorLoc=range.location+range.length;

    misspellingcount ++;

    var misSpelledWord = aString.substring(range.location, (range.location+range.length))
    var guesses = [[NSSpellChecker sharedSpellChecker] guessesForWordRange:range inString:aString language:language inSpellDocumentWithTag:0];

    //Build our alert
    var alert = NSAlert.alloc().init();

    alert.setMessageText('Spell Check Whole Page');
    alert.addButtonWithTitle('Skip'); //We must have a button here, so Skip makes the most sense.
    //alert.setIcon(NSImage.alloc().initWithContentsOfFile(
    //    context.plugin.urlForResourceNamed('DialogIcon512.png').path()));
    var nibui = new NibUI(context,
      'UIBundle', 'SpellCheckWholePage',
      ['textMisSpelling', 'replaceComboBox', 'btnReplace','btnIgnoreAll','btnAddDict','btnDone','textFullText']);

    alert.setAccessoryView(nibui.view);

    //Set up our text
    nibui.textMisSpelling.stringValue = "Mispelling: "+ misSpelledWord;
    //nibui.textFullText.stringValue = aString;
    nibui.textFullText.setString(aString);

    //Put guesses into the combobox
    nibui.replaceComboBox.removeAllItems();
    if ( guesses ){
      if (guesses.length >0){
        nibui.replaceComboBox.addItemsWithObjectValues( guesses );
        nibui.replaceComboBox.selectItemAtIndex( 0 );
      }
    }

    //Set up our button functions
    nibui.attachTargetAndAction(nibui.btnReplace, function() {
      madeAChange=true;
      //replace it in our string
      //var newWord = nibui.replaceComboBox.objectValueOfSelectedItem();
      var newWord = nibui.replaceComboBox.stringValue();
      aString = aString.replace( misSpelledWord, newWord);
      cursorLoc = range.location + newWord.length();
      app.stopModal();
    });

    nibui.attachTargetAndAction(nibui.btnDone, function() {
      // Stop!
      stopChecking = true;
      app.stopModal();
    });

    nibui.attachTargetAndAction(nibui.btnIgnoreAll, function(){

      //Ignore word for this document
      [[NSSpellChecker sharedSpellChecker] ignoreWord: misSpelledWord inSpellDocumentWithTag: 0]
      app.stopModal();
    });

    nibui.attachTargetAndAction(nibui.btnAddDict, function() {

      // Add the word to the Dictionary.
      [[NSSpellChecker sharedSpellChecker] learnWord: misSpelledWord]
      app.stopModal();
    });
    alert.runModal();

    nibui.destroy();
    if(stopChecking){
      break; //If the user hits "Done", stop checking
    }
    //Recheck the text for a misspelling (and loop again if there is one)
    range = [[NSSpellChecker sharedSpellChecker] checkSpellingOfString:aString startingAt:cursorLoc];

    if (range.location < cursorLoc ){
      //Break out of the loop if the search is resetting to the beginning
      break;
    }
  }
  var spellcheckresult = {"corrected":aString, "madeAChange":madeAChange, "misspellingcount":misspellingcount, "stopChecking":stopChecking};
  return spellcheckresult;
}
