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
      this.candidateLayers = [];

      if ( this.qlayers.length ) { 
        for (var i=0, len=this.qlayers.length; i<len; ++i) {
          var layer_id = this.qlayers[i];
          var selectedLayer = this.map.getLayersBy(this.qlayers_id_field,
                                                   layer_id);
          if (typeof selectedLayer[0] != 'undefined') {
            this.candidateLayers.push(selectedLayer[0]);
          }
        }
      } else {
        // Candidate layers are WMS layers marked as having a legend
        for (var i=0, len=this.map.layers.length; i<len; ++i) {
          var layer = this.map.layers[i];
          if ( layer.CLASS_NAME == 'OpenLayers.Layer.WMS' ) {
            if ( layer.hasLegend == 1 ) {
              this.candidateLayers.push(layer);
            } //else console.log("WMS layer "+layer.name+" does not have a legend");
          }
        }
      }
    }

    //console.log("Candidate layers:"); console.dir(this.candidateLayers);

    return this.candidateLayers;
  },

  updateLayerLegend: function(layer)
  {
    // Create layer legend
    var divID = this.div.id + "-"+layer.drupalID;
    //var div = document.getElementById(divID);
    var div = document.createElement("div");
    //OpenLayers.Element.addClass(this.legendDiv, "openlayers-legend"); 
    OpenLayers.Element.addClass(this.legendDiv, "openlayers-legend-layer"); 
    div.id = divID;

    var url = layer.getFullRequestString({
      REQUEST: "GetLegendGraphic",
      EXCEPTIONS: "application/vnd.ogc.se_inimage",
      FORMAT: 'image/png',
      LAYER: layer.params.LAYERS,
      WIDTH: layer.map.size.w,
      HEIGHT: layer.map.size.h
    });

    div.innerHTML = layer.name + '<br><img src="' + url + '">';
    this.legendDiv.appendChild(div);
  },

  updateLegend: function(evt)
  {
    if ( evt && evt.type == 'changelayer' && evt.property != 'visibility' ) {
      return; // we only care about visibility changes
    }

    // TODO: only update the legend for evt.layer object!

    this.legendDiv.innerHTML = '';
    //this.legendDiv.innerHTML += '- LEGEND -';
    var candidateLayers = this.getCandidateLayers();
    for (var i=0, len=candidateLayers.length; i<len; ++i) {
      var layer = candidateLayers[i];

      // Only show legend for visible layers
      if ( layer.getVisibility() ) {
        this.updateLayerLegend(layer);
      }
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
    this.updateLegend();

    // Then update on changes..
    var updateFunctor = OpenLayers.Function.bind(this.updateLegend, this);
    this.map.events.on({
      //'moveend': updateFunctor,
      'addlayer': updateFunctor,
      'removelayer': updateFunctor,
      'changelayer': updateFunctor
    });

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

    if ( options.div ) {
      var outdiv = $('#'+options.div)[0];
      // if ( ! outdiv ) console.log ('unknown division id '+options.div);
    }

    if ( ! outdiv ) {
      /* this will be outside of the map */
      var outdiv = context.parentNode; 
    }

    var legendControl = new Drupal.openlayers.LegendControl({
      qlayers_id_field: 'drupalID',
      qlayers: layer_ids,
      div: outdiv,
      autoActivate: true
    });
    var map = data.openlayers;
    map.addControl(legendControl);

  }

};

