var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.apiUtils = {
  /**** general helper methods to handle API calls ****/
  CHANGE_CARET_ELEMENT_MESSAGE_TYPE: 'dropdown_caret_element_changed',
  DROPDOWN_ELEMENT_CHANGED: 'dropdown_element_changed',
  FORMATTING_BUTTON_PRESSED: 'formatting_button_pressed',
  lastDataSent: {},

  startListeningToApiEvents: function() {
    var self = this;
    var outboundApiEventsTarget = helper.padChrome$.window.parent;

    outboundApiEventsTarget.addEventListener('message', function(e) {
      self.lastDataSent[e.data.type] = e.data;
    });
  },

  waitForDataToBeSent: function(eventType, done) {
    var self = this;
    helper.waitFor(function() {
      return self.lastDataSent[eventType];
    }).done(done);
  },

  getLastCaretElementChange: function() {
    var elementType;
    var lastMessageSent = this.lastDataSent[this.CHANGE_CARET_ELEMENT_MESSAGE_TYPE];
    if (lastMessageSent) {
      elementType = lastMessageSent.elementType;
    }
    return elementType;
  },

  waitForApiToSend: function(valueToBeSent, done) {
    var self = this;
    helper.waitFor(function() {
      var elementSentToApi = self.getLastCaretElementChange();
      return elementSentToApi === valueToBeSent;
    }, 4000).done(done);
  },

  // **** DROPDOWN_ELEMENT_CHANGED ****/
  /*
    message: {
      type: 'dropdown_element_changed',
      element: 'action'
     }
  */
  simulateTriggerOfDropdownChanged: function(element) {
    var message = {
      type: this.DROPDOWN_ELEMENT_CHANGED,
      element: element,
    };

    var inboundApiEventsTarget = helper.padChrome$.window;
    inboundApiEventsTarget.postMessage(message, '*');
  },

  simulateTriggerOfFormattingButtonChanged: function(buttonName) {
    var message = {
      type: this.FORMATTING_BUTTON_PRESSED,
      buttonName: buttonName,
    };

    var inboundApiEventsTarget = helper.padChrome$.window;
    inboundApiEventsTarget.postMessage(message, '*');
  },
}
