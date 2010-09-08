// $Id$

/**
 * @file
 * File to hold custom context styling
 */

/**
 * Style context class
 */
Drupal.openlayers.style_plugin.dolpp_cluster_label_plugin = function (params) {

  this.params = params;

};

/**
 * Style context methods
 */
Drupal.openlayers.style_plugin.dolpp_cluster_label_plugin.prototype = {

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
  'getLabel' : function(feature) {

    var count = this.countFeatures(feature);
    return count > 1 ? count : ''; // to string should probably be..
  }

}

