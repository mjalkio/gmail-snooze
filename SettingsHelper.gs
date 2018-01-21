function setNextRatingPromptDate(daysInTheFuture) {
  var settings = getOrCreateSettings();
  if (daysInTheFuture < 0) {
    // Set to an impossibly future date
    settings.nextRatingPromptDate = new Date(3000, 01, 01);
  }
  else {
    var date = new Date();
    date = addDays(date, daysInTheFuture);
    settings.nextRatingPromptDate = date;
  }
  setSettings(getSettings(), settings);
}

function setup() {
  validateAndSetSettings(getSettings());
}

function validateAndSetSettings(settings) {
  if (settings == null) {
    throw 'Cannot have a null settings object';
  }

  Logger.log(JSON.stringify(settings));

  // Required field checks
  if (isNullOrWhiteSpace(settings.processSnoozeTime12Hour) || settings.processSnoozeTime12Hour < 0 || settings.processSnoozeTime12Hour > 12) {
    throw 'Invalid snooze processing hour. Please specify a positive number between 1 and 12';
  }
  if (isNullOrWhiteSpace(settings.processSnoozeTimeMinute) || settings.processSnoozeTimeMinute < 0 || settings.processSnoozeTimeMinute > 59) {
    throw 'Invalid snooze processing minute. Please specify a positive number between 0 and 59';
  }
  if (isNullOrWhiteSpace(settings.processSnoozeTimeAmPm) || (settings.processSnoozeTimeAmPm != 'AM' && settings.processSnoozeTimeAmPm != 'PM')) {
    throw 'Invalid snooze processing AM/PM value. Please specify either AM or PM';
  }
  if (isNullOrWhiteSpace(settings.maxSnoozeDays) || settings.maxSnoozeDays < 1 || settings.maxSnoozeDays > 99) {
    throw 'Invalid snooze days value. Please specify a positive number less than or equal to 99';
  }
  if (isNullOrWhiteSpace(settings.snoozedParentLabelName)) {
    throw 'Invalid snoozed parent label name. Pleas specify a valid parent label name';
  }
  if (settings.markWithUnsnoozeLabelAfterSnoozeExpires && isNullOrWhiteSpace(settings.unSnoozedLabelName)) {
    throw 'You cannot specify to mark expired snoozes with an unsnoozed label without providing a valid unsnoozed label name to apply';
  }

  setSettings(getSettings(), settings);
  return settings;
}

function getOrCreateSettings() {
  var settings = getSettings();
  if (!settings) {
    settings = createDefaultSettings();
    setSettings(null, settings);
  }
  return settings;
}

function getSettings() {
  var settingsString = PropertiesService.getUserProperties().getProperty('GmailSnoozeSettings');
  if (settingsString == null || settingsString == '') {
    return null;
  } else {
    Logger.log('Retrieved settings: ' + settingsString);
    return JSON.parse(settingsString);
  }
}

function setSettings(oldSettings, newSettings) {
  var oldSettingsString = oldSettings == null ? '' : JSON.stringify(oldSettings);
  Logger.log('Old settings string: ' + oldSettingsString);

  var newSettingsString = JSON.stringify(newSettings);
  Logger.log('New settings string: ' + newSettingsString);

  // Only do work if the settings have changed
  if (oldSettingsString != newSettingsString) {
    PropertiesService.getUserProperties().setProperty('GmailSnoozeSettings', newSettingsString);

    // Delete existing triggers
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() == 'processSnoozes') {
        ScriptApp.deleteTrigger(triggers[i]);
      }
    }

    if (newSettings.appEnabled) {
      // Re-create the trigger if enabled
      Logger.log('Creating a new trigger');
      var hour24 = (newSettings.processSnoozeTime12Hour % 12) + (newSettings.processSnoozeTimeAmPm == 'AM' ? 0 : 12);
      ScriptApp.newTrigger('processSnoozes').timeBased().everyDays(1).atHour(hour24).nearMinute(newSettings.processSnoozeTimeMinute).create();

      // Setup labels
      setupLabelsIfNeeded(newSettings);
    }
  }
}

function createDefaultSettings() {
  return {
    appEnabled : true,
    maxSnoozeDays : 7,
    processSnoozeTime12Hour : 7,
    processSnoozeTimeMinute : 0,
    processSnoozeTimeAmPm : 'AM',
    snoozedParentLabelName : 'Snoozed',
    markUnreadAfterSnoozeExpires : true,
    markWithUnsnoozeLabelAfterSnoozeExpires : true,
    unSnoozedLabelName : 'Unsnoozed',
    nextRatingPromptDate: addDays(new Date(), 3)
  };
}

function isNullOrWhiteSpace(input) {
  if (typeof input === 'undefined' || input == null) {
    return true;
  }
  return input.replace(/\s/g, '').length < 1;
}

function addDays(dateObject, numDays) {
  dateObject.setDate(dateObject.getDate() + numDays);
  return dateObject;
}