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
    if (settings != null) {
      setupLabelsIfNeeded(settings);
      moveSnoozes(settings);
    }
  } catch (err) {
    throw 'Error processing today\'s snoozes: ' + err;
  }
}

function setupLabelsIfNeeded(settings) {
  // Create the unsnoozed label if necessary
  if (settings.markWithUnsnoozeLabelAfterSnoozeExpires) {
    if (GmailApp.getUserLabelByName(settings.unSnoozedLabelName) === null) {
      Logger.log('Creating label ' + settings.unSnoozedLabelName);
      GmailApp.createLabel(settings.unSnoozedLabelName);
    }
  }

  // Create the parent snoozed label if necessary
  var snoozedParentLabel = GmailApp.getUserLabelByName(settings.snoozedParentLabelName);
  if (snoozedParentLabel === null) {
    Logger.log('Creating label ' + settings.snoozedParentLabelName);
    GmailApp.createLabel(settings.snoozedParentLabelName);
  }

  // Create/delete obsolete child snoozed labels if necessary
  for (var i = 1; i <= 99; i++) {
    var thisChildSnoozedLabelName = getChildSnoozedLabelName(settings, i);
    var thisChildSnoozedLabel = GmailApp.getUserLabelByName(thisChildSnoozedLabelName);
    var labelShouldExist = i <= settings.maxSnoozeDays;
    if (thisChildSnoozedLabel === null) {
      if (labelShouldExist) {
        Logger.log('Creating label ' + thisChildSnoozedLabelName);
        GmailApp.createLabel(thisChildSnoozedLabelName);
      } else {
        // label doesn't exist (and that's good, so stop here)
        break;
      }
    } else {
      if (!labelShouldExist) {
        Logger.log('Deleting obsolete label ' + thisChildSnoozedLabelName);
        GmailApp.deleteLabel(thisChildSnoozedLabel);
      }
    }
  }
}

function moveSnoozes(settings) {
  var oldLabel,
  newLabel,
  page;
  for (var i = 1; i <= settings.maxSnoozeDays; i++) {
    newLabel = oldLabel;
    oldLabel = GmailApp.getUserLabelByName(getChildSnoozedLabelName(settings, i));
    page = null;
    // Get threads in "pages" of 100 at a time
    while (!page || page.length == 100) {
      page = oldLabel.getThreads(0, 100);
      if (page.length > 0) {
        if (newLabel) {
          // Move the threads into "today’s" label
          newLabel.addToThreads(page);
        } else {
          // Unless it’s time to unsnooze it
          GmailApp.moveThreadsToInbox(page);
          if (settings.markUnreadAfterSnoozeExpires) {
            GmailApp.markThreadsUnread(page);
          }
          if (settings.markWithUnsnoozeLabelAfterSnoozeExpires) {
            GmailApp.getUserLabelByName(settings.unSnoozedLabelName)
            .addToThreads(page);
          }
        }
        // Move the threads out of "yesterday’s" label
        oldLabel.removeFromThreads(page);
      }
    }
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