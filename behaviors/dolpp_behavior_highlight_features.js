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
  getDrupalFids: function(feature) {
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

  matchesSample: function(candidate) {
    if ( ! candidate.cluster ) {
      return this.selectedFIDS[candidate.drupalFID] !== undefined;
    } else {
      for(var i = 0; i < candidate.cluster.length; i++) {
        var pf = candidate.cluster[i]; // pseudo-feature
        if ( this.selectedFIDS[pf.drupalFID] !== undefined ) return true;
      }
      return false;
    }
  },

  unhighlightAll: function() {
    var layers = this.layers || [this.layer];
    var layer, feature;
    for(var l=0; l<layers.length; ++l) {
      layer = layers[l];
      for(var i=layer.selectedFeatures.length-1; i>=0; --i) {
        feature = layer.selectedFeatures[i];
        this.unhighlight(feature);
      }
      layer.selectedFeatures = [];
    }
  },

  highlight: function(feature) {
    var style = this.selectStyle || this.renderIntent;
    var layer = feature.layer;
    layer.drawFeature(feature, style);
    layer.selectedFeatures.push(feature);
  },

  highlightLike: function(sample) {

    this.unhighlightAll();

    this.selectedFIDS = this.getDrupalFids(sample);
    if ( ! this.selectedFIDS ) return;

    var layer = sample.layer;
    for(var i = 0; i < layer.features.length; i++) {
      var candidate = layer.features[i];
      if ( this.matchesSample(candidate) ) {
        this.highlight(candidate);
      }
    }

  },

  initialize: function(layers, options) {

      OpenLayers.Control.prototype.initialize.apply(this, [options]);

      if(this.scope === null) {
          this.scope = this;
      }

      this.initLayer(layers);

      var callbacks = {
          over: this.highlightLike,
          out: this.unhighlightAll
      }

      this.callbacks = OpenLayers.Util.extend(callbacks, this.callbacks);
      this.handlers = {
          feature: new OpenLayers.Handler.Feature(
              this, this.layer, this.callbacks,
              {geometryTypes: this.geometryTypes}
          )
      };

      // HACK: forward all events to next handler 
      this.handlers['feature'].stopClick = false;
      this.handlers['feature'].stopDown = false;
      this.handlers['feature'].stopUp = false;
      this.handlers['feature'].dblclick = function(evt) {
        return true;
      };
  },


  // We'll allow selection of multiple features
  multiple: true,

  CLASS_NAME: 'Drupal.dolpp.HighlightFeatures'
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
      //'hover': !!options.hover 
      //, autoActivate: true
    });

  map.addControl(control);
  control.activate();

};

