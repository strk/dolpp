// $Id$

/**
 * @file
 * Legend Behavior
 */

/*
 * OpenLayers Legend Control class
 * TODO: move away of Drupal.openlayers namespace
 */
Drupal.openlayers.LegendControl = OpenLayers.Class(OpenLayers.Control, {

  /**
   * Method: getCandidateLayers
   * Internal method for lazy candidate layers extraction
   *
   * Returns:
   * {Array} list of layer references found on map with given id
   */
  getCandidateLayers: function() {

    if ( ! this.candidateLayers ) {
      if ( this.qlayers.length ) {
        this.candidateLayers = [];
        for (var i=0, len=this.qlayers.length; i<len; ++i) {
          var layer_id = this.qlayers[i];
          var selectedLayer = this.map.getLayersBy(this.qlayers_id_field,
                                                   layer_id);
          if (typeof selectedLayer[0] != 'undefined') {
            this.candidateLayers.push(selectedLayer[0]);
          }
        }
      } else {
        this.candidateLayers = this.map.layers;
      }
    }

    //console.log("Candidate layers:"); console.dir(this.candidateLayers);

    return this.candidateLayers;
  },

  writeLayerLegend: function(layer, text)
  {
    var divID = this.div.id + "-"+layer.drupalID;
    var div = document.getElementById(divID);
    if ( div ) div.innerHTML = layer.name + '<br>' + text;
  },

  toggleLayerLegendVisibility: function(evt)
  {
    var layer = evt.object;
    if ( layer.getVisibility() ) {
        var handler = OpenLayers.Function.bind(this.writeLayerLegend, this);
        layer.enableLegend(handler);
    } else {
      var divID = this.div.id + "-"+layer.drupalID;
      var div = document.getElementById(divID);
      div.innerHTML = '';
      if ( layer.disableLegend ) layer.disableLegend();
    }
  },

  setupLayerLegend: function(layer)
  {
    if ( layer.enableLegend ) {

      // Create layer legend div
      var divID = this.div.id + "-"+layer.drupalID;
      var div = document.createElement("div");
      OpenLayers.Element.addClass(this.legendDiv, "openlayers-legend-layer"); 
      div.id = divID;
      this.legendDiv.appendChild(div);

      if ( layer.getVisibility() ) {
        var handler = OpenLayers.Function.bind(this.writeLayerLegend, this);
        layer.enableLegend(handler);
      }

      var visibilityToggler = OpenLayers.Function.bind(
          this.toggleLayerLegendVisibility, this);
      layer.events.register('visibilitychanged', layer, visibilityToggler);
    }
  },

  setupLegend: function()
  {
    this.legendDiv.innerHTML = '';
    //this.legendDiv.innerHTML += '- LEGEND -';
    var candidateLayers = this.getCandidateLayers();
    for (var i=0, len=candidateLayers.length; i<len; ++i) {
      var layer = candidateLayers[i];
      this.setupLayerLegend(layer);
    }
  },

  activate: function()
  {
    //console.log('Activate!, this div:'); console.dir(this.div);

    // Create legend div
    this.legendDiv = document.createElement("div");

    this.legendDiv.id = this.div.id + "-legend";
    //this.legendDiv.style.color = '#ffffff';
    OpenLayers.Element.addClass(this.legendDiv, "openlayers-legend"); 
    this.div.appendChild(this.legendDiv);

    // Build legend once at start
    this.setupLegend();

    return OpenLayers.Control.prototype.activate.apply(
        this, arguments
    );
  },


});

/**
 * Behavior for Legend 
 */
Drupal.behaviors.dolpp_behavior_legend = function(context) {

  var data = $(context).data('openlayers');
  if (data && data.map.behaviors['dolpp_behavior_legend']) {

    var options = data.map.behaviors['dolpp_behavior_legend'];

    var layer_ids = [];
    for (var i in options.layers) {
      var layer_id = options.layers[i];
      if ( layer_id !== 0 ) layer_ids.push(layer_id);
    }

    var legendControl = new Drupal.openlayers.LegendControl({
      qlayers_id_field: 'drupalID',
      qlayers: layer_ids,
      div: context.parentNode, /* this will be outside of the map */
      autoActivate: true
    });
    var map = data.openlayers;
    map.addControl(legendControl);

  }

};

