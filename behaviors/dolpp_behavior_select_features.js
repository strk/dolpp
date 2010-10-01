// $Id$

/**
 * @file
 * SelectFeature Behavior
 */

Drupal.behaviors.dolpp_behavior_select_features = function(context) {

  var data = $(context).data('openlayers');
  if (data && data.map.behaviors['dolpp_behavior_select']) {

    var options = data.map.behaviors['dolpp_behavior_select'];

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

    var control = new OpenLayers.Control.SelectFeatures({
      autoActivate: true
    });
    var map = data.openlayers;
    map.addControl(control);

  }

};

