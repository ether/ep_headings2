var changeElementOnDropdownChange = require('./changeElementOnDropdownChange');

var CHANGE_CARET_ELEMENT_MESSAGE_TYPE = 'dropdown_caret_element_changed';
var DROPDOWN_ELEMENT_CHANGED          = 'dropdown_element_changed';

exports.init = function(ace) {
  // listen to outbound calls of this API
  window.addEventListener('message', function(e) {
    _handleOutboundCalls(e, ace);
  });
}

exports.triggerCaretElementChanged = function (elementType) {
  var message = {
    type: CHANGE_CARET_ELEMENT_MESSAGE_TYPE,
    elementType: elementType,
  };
  _triggerEvent(message);
}

var _triggerEvent = function _triggerEvent(message) {
  // if there's a wrapper to Etherpad, send data to it; otherwise use Etherpad own window
  var target = window.parent ? window.parent : window;
  target.postMessage(message, '*');
}

var _handleOutboundCalls = function _handleOutboundCalls(e, ace) {
  if (e.data.type === DROPDOWN_ELEMENT_CHANGED) {
    changeElementOnDropdownChange.updateElementOfSelection(ace, e.data.element);
  }
}
