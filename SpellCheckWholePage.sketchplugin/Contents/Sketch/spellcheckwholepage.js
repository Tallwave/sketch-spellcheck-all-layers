@import 'sketch-nibui.js';

function onRun(context) {
  var sketch = context.api();
  var doc = context.document;
  var app = NSApplication.sharedApplication();
  var language = [[NSSpellChecker sharedSpellChecker] language]

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
  var stopChecking = false;
  while (layer = [loop nextObject]) {
    if(stopChecking){
      break; //If the user hits "Done", stop checking
    }

    //do spellcheck on each layer
    var aString = [layer stringValue]
    range = [[NSSpellChecker sharedSpellChecker] checkSpellingOfString:aString startingAt:0];
    if(range.length >0){
      //Select the layer
      [layer select:true byExpandingSelection:false]

      var misSpelledWord = aString.substring(range.location, (range.location+range.length))
      allWords = allWords+"\nText: "+aString+"\nMisspelled Word: "+misSpelledWord+"\n";
      misspellingcount ++;

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
      nibui.textFullText.stringValue = aString;

      //Put guesses into the combobox
      nibui.replaceComboBox.removeAllItems();
      if (guesses.length >0){
        nibui.replaceComboBox.addItemsWithObjectValues( guesses );
        nibui.replaceComboBox.selectItemAtIndex( 0 );
      }

      //Set up our button functions
      nibui.attachTargetAndAction(nibui.btnReplace, function() {
        //Do text replace
        layer.setIsEditingText(true);
        layer.setStringValue(aString.replace( misSpelledWord, nibui.replaceComboBox.objectValueOfSelectedItem()));
        layer.setIsEditingText(false);
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

    }
  }
}
