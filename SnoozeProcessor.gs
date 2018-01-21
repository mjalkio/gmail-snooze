function getSettings() {
  // Hard-code the settings that I want
  return {
    snoozedParentLabelName : 'Snoozed',
    markUnreadAfterSnoozeExpires : true,
    markWithUnsnoozeLabelAfterSnoozeExpires : false,
    unSnoozedLabelName : 'Unsnoozed'
  };
}

function processSnoozes() {
  try {
    var settings = getSettings();
    moveSnoozes(settings);
  } catch (err) {
    throw 'Error processing today\'s snoozes: ' + err;
  }
}

function moveSnoozes(settings) {
  var snoozeDay = 1;
  var newLabel = null;
  var oldLabel = null;

  while (oldLabel !== null || snoozeDay == 1) {
    newLabel = oldLabel;
    oldLabel = GmailApp.getUserLabelByName(getChildSnoozedLabelName(settings, i));
    var page = null;
    // Get threads in "pages" of 100 at a time
    while (page === null || page.length == 100) {
      page = oldLabel.getThreads(0, 100);
      if (page.length > 0) {
        if (newLabel !== null) {
          // Move the threads into "today’s" label
          newLabel.addToThreads(page);
        } else {
          // Unless it’s time to unsnooze it
          GmailApp.moveThreadsToInbox(page);
          if (settings.markUnreadAfterSnoozeExpires) {
            GmailApp.markThreadsUnread(page);
          }
          if (settings.markWithUnsnoozeLabelAfterSnoozeExpires) {
            GmailApp.getUserLabelByName(
              settings.unSnoozedLabelName).addToThreads(page);
          }
        }
        // Move the threads out of "yesterday’s" label
        oldLabel.removeFromThreads(page);
      }
    }

    snoozeDay += 1;
  }
}

function getChildSnoozedLabelName(settings, index) {
  return settings.snoozedParentLabelName + '/'
   + pad(index, 2)
   + ' day'
   + (index > 1 ? 's' : '');
}

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}