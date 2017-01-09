#import <Cocoa/Cocoa.h>

@interface DummyNibOwner : NSObject


/* View bindings go here */
@property IBOutlet NSTextField *textMisSpelling;
@property IBOutlet NSComboBox *replaceComboBox;
@property IBOutlet NSButton *btnSkip;
@property IBOutlet NSButton *btnReplace;
@property IBOutlet NSButton *btnIgnoreAll;
@property IBOutlet NSButton *btnAddDict;
@property IBOutlet NSButton *btnDone;
@property IBOutlet NSTextField *textFullText;
/* End of view bindings */


@end

@implementation DummyNibOwner
@end
