// $Id$

/**
 * @file
 * SelectFeature Behavior
 */

Drupal.behaviors.dolpp_behavior_select_feature = function(context) {

  var data = $(context).data('openlayers');
  if ( ! data ) return;

  if ( ! data.map.behaviors['dolpp_behavior_select_feature'] ) return;
  var options = data.map.behaviors['dolpp_behavior_select_feature'];

  var map = data.openlayers;

  // If layers is not defined, then include all vector layers
  var layers = [];
  if (typeof options.layers == 'undefined' || options.layers.length == 0) {
    layers = map.getLayersByClass('OpenLayers.Layer.Vector');
  }
  else {
    for (var i in options.layers) {
      var selectedLayer = map.getLayersBy('drupalID', options.layers[i]);
      if (typeof selectedLayer[0] != 'undefined') {
        layers.push(selectedLayer[0]);
      }
    }
  }

  var control = new OpenLayers.Control.SelectFeature(layers,
    {
      onSelect: this.onSelect,
      onUnSelect: this.onUnselect,
      hover: true, // TODO: use options for this
      autoActivate: true
    });

  map.addControl(control);

};

Drupal.behaviors.dolpp_behavior_select_feature.prototype = {
  'onSelect': function(feature) {
    console.log("onSelect called");
  },
  'onUnSelect': function(feature) {
    console.log("onUnSelect called");
  }
};

