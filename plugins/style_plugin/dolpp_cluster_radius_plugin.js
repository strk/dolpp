// $Id$

/**
 * @file
 * File to hold custom context styling
 */

/**
 * Style context class
 */
Drupal.openlayers.style_plugin.dolpp_cluster_radius_plugin = function (params) {

  this.params = params;

};

/**
 * Style context methods
 */
Drupal.openlayers.style_plugin.dolpp_cluster_radius_plugin.prototype = {

  'countFeatures' : function(feature) {
    if ( feature.cluster ) {
      var count = 0;
      var cluster = feature.cluster;
      var visited = []; 
      for(var i = 0; i < cluster.length; i++) {
        if ( typeof cluster[i].drupalFID != 'undefined' ) {
          var id = cluster[i].drupalFID;
          if (id in visited) continue;
          visited[id] = true;
        }
        ++count;
      }
      return count;
    } else {
      return 1;
    }
  },

  // Point radius computer.
  // Returns a point radius based on number of features in cluster
  // limiting the radius between a given min/max range
  'getPointRadius' : function(feature) {


    var min = parseInt(this.params.point_radius_min);
    var max = parseInt(this.params.point_radius_max);
    var wgt = parseInt(this.params.feature_weight);

    var rad = min;
    var count = this.countFeatures(feature);
    if ( count > 1 ) {
       --count;
       // single-feature cluster gets the min value
       rad += count*wgt;
    }
    if ( rad > max ) {
       //console.log("Point radius saturated ("+rad+" > "+max+"!)");
       rad = max;
       // TODO: signal saturation
    }
    //console.log("Radius: "+rad);
    return rad;
  }

}

