var ep_script_elements_test_helper = ep_script_elements_test_helper || {};
ep_script_elements_test_helper.apiUtils = {
  /**** general helper methods to handle API calls ****/
  CHANGE_CARET_ELEMENT_MESSAGE_TYPE: 'dropdown_caret_element_changed',
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

}
