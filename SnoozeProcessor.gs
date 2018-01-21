var settings = {
  snoozedParentLabelName : 'Snoozed',
  markUnreadAfterSnoozeExpires : true,
  markWithUnsnoozeLabelAfterSnoozeExpires : false,
  unSnoozedLabelName : 'Unsnoozed'
};

function processSnoozes() {
  try {
    moveSnoozes();
  } catch (err) {
    throw 'Error processing today\'s snoozes: ' + err;
  }
}

function moveSnoozes() {
  var snoozeDay = 1;
  var newLabel = null;
  var oldLabel = null;

  while (oldLabel !== null || snoozeDay == 1) {
    newLabel = oldLabel;
    oldLabel = GmailApp.getUserLabelByName(getChildSnoozedLabelName(snoozeDay));
    snoozeDay += 1;

    if (oldLabel === null) {
      continue;  // No label, we're done!
    }

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
  }
}

function getChildSnoozedLabelName(index) {
  // Will not work if we snooze for over 99 days!
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