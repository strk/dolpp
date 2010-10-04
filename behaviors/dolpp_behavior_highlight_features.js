// $Id$

/**
 * @file
 * SelectFeature Behavior
 */
Drupal.dolpp = Drupal.dolpp || {};

Drupal.dolpp.HighlightFeatures = OpenLayers.Class(OpenLayers.Control.SelectFeature,
{
  /* Get an index of drupal fids contained in the given feature
   * (possibly clustered)
   */
  'getDrupalFids': function(feature) {
    var fidcount = 0;
    var fids = [];
    if ( ! feature.cluster ) {
      if ( feature.drupalFID != undefined ) {
        if ( ! fids[feature.drupalFID] ) {
          fids[feature.drupalFID] = 1;
          ++fidcount;
        }
      }
    }
    else {
      for(var i = 0; i < feature.cluster.length; i++) {
        var pf = feature.cluster[i]; // pseudo-feature
        if ( pf.drupalFID != undefined ) {
          if ( ! fids[feature.drupalFID] ) {
            fids[pf.drupalFID] = 1;
            ++fidcount;
          }
        }
      }
    }
    if ( ! fidcount ) return null;
    return fids;
  },

  'isSelected': function(feature) {
    if ( ! feature.cluster ) {
      return this.selectedFIDS[feature.drupalFID] !== undefined;
    } else {
      for(var i = 0; i < feature.cluster.length; i++) {
        var pf = feature.cluster[i]; // pseudo-feature
        if ( this.selectedFIDS[pf.drupalFID] !== undefined ) return true;
      }
      return false;
    }
  },

  'onSelect': function(feature) {

    if ( this.selectedFIDS ) return;

    this.selectedFIDS = this.getDrupalFids(feature);
    if ( ! this.selectedFIDS ) return;

    var layer = feature.layer;
    for(var i = 0; i < layer.features.length; i++) {
      var pf = layer.features[i];
      if ( this.isSelected(pf) ) {
        this.select(pf); // 'highlight' is implemented in base class
      }
    }
  }

  , 'onUnselect': function(feature) {
    if ( ! this.selectedFIDS ) return;
    delete this.selectedFIDS;
    this.unselectAll();
  }
  , 'hover': true
  //, 'highlightOnly': true
});


Drupal.behaviors.dolpp_behavior_highlight_features = function(context) {

  var data = $(context).data('openlayers');
  if ( ! data ) return;

  if ( ! data.map.behaviors['dolpp_behavior_highlight_features'] ) return;
  var options = data.map.behaviors['dolpp_behavior_highlight_features'];

  var map = data.openlayers;

  var layers = [];
  for (var i in options.layers) {
    var selectedLayer = map.getLayersBy('drupalID', options.layers[i]);
    if (typeof selectedLayer[0] != 'undefined') {
      layers.push(selectedLayer[0]);
    }
  }
  // If no layers were found, include all vector layers
  if (layers.length == 0) {
    layers = map.getLayersByClass('OpenLayers.Layer.Vector');
  }

  //var control = new OpenLayers.Control.SelectFeature(layers,
  var control = new Drupal.dolpp.HighlightFeatures(layers,
    {
      //, hover: true // TODO: use options for this
      //, autoActivate: true
    });

  map.addControl(control);
  control.activate();

};

