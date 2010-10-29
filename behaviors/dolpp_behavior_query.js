// $Id$

/**
 * @file
 * Query Behavior
 */

/*
 * OpenLayers Query Control class
 * TODO: move out of Drupal.openlayers namespace
 */
Drupal.openlayers.QueryControl = OpenLayers.Class(OpenLayers.Control, {

  defaultHandlerOptions: {
    'single': true,
    'double': false,
    'pixelTolerance': 0,
    'stopSingle': false,
    'stopDouble': false
  },

  /**
   * Constructor: <Drupal.behaviors.QueryControl>
   *
   * Parameters:
   * @options - {Object}
   * In addition to common Control options, this class also accepts:
   *  'radius'           Query radius (for vector layers)
   *  'timeout'          Timeout for WMS GetFeatureInfo request, milliseconds
   *  'qlayer_ids'       Identifying values for layers to query
   *  'qlayer_id_field'  Name of the field containing layer's identifier
   */
  initialize: function(options) {

    this.handlerOptions = OpenLayers.Util.extend(
      {}, this.defaultHandlerOptions
    );

    OpenLayers.Control.prototype.initialize.apply(this, arguments); 

    //console.log("handlerOptions: "); console.dir(this.handlerOptions);
    this.handler = new OpenLayers.Handler.Click(
      this, {
        'click': this.trigger
      }, this.handlerOptions
    );

  }, 

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
            var layer = selectedLayer[0];
            // TODO: drop unqueriable WMS from candidates ?
            this.candidateLayers.push(layer);
          }
        }
      } else {
        // Candidate layers are vector layers and WMS layers
        // marked as queryable
        for (var i=0, len=this.map.layers.length; i<len; ++i) {
          var layer = this.map.layers[i];
          if ( layer.CLASS_NAME == 'OpenLayers.Layer.Vector' ) {
            this.candidateLayers.push(layer);
          }
          else if ( layer.CLASS_NAME == 'OpenLayers.Layer.WMS' ) {
            if ( layer.queryable == 1 ) {
              this.candidateLayers.push(layer);
            } //else console.log("WMS layer "+layer.name+" is not queryable");
          }
        }
      }
    }

    //console.log("Candidate layers:"); console.dir(this.candidateLayers);

    return this.candidateLayers;
  },

  /* private
   *
   * Compute per-query informations 
   * - layers to query (only visible ones from the candidate list)
   * - tolerance in geographical units (depends on scale)
   * - queryPoint in geographical units (depends on query point)
   */
  prepareQuery: function(evt) {

    // TODO: cancel anything related to previous query
    //       if any

    var px1 = evt.xy;
    var px2 = evt.xy.add(this.radius, 0);

    var lonlat1 = this.map.getLonLatFromPixel(px1);
    var lonlat2 = this.map.getLonLatFromPixel(px2);

    var queryPoint = new OpenLayers.Geometry.Point(lonlat1.lon, lonlat1.lat);
    var distPoint = new OpenLayers.Geometry.Point(lonlat2.lon, lonlat2.lat);

    this.tolerance = queryPoint.distanceTo(distPoint);
    this.queryPoint = queryPoint;
    this.queryPixel = this.map.getLonLatFromPixel(px1);
    this.layerInfo = [];

    // Find the actual layers to query, based on their visibility
    this.queryLayers = [];
    var candidateLayers = this.getCandidateLayers();
    for (var i=0, len=candidateLayers.length; i<len; ++i) {
      var layer = candidateLayers[i];

      // Only query visible layers
      if ( layer.getVisibility() ) {
        var typ = layer.CLASS_NAME.split('.')[2];

        // If highlighting...
        if ( this.doHighlight && typ === 'Vector' ) {
          this.unhighlightLayer(layer);
        }

        var meth = 'query'+typ+'Layer';
        if ( typeof this[meth] == 'function' ) {
          this.queryLayers.push({'layer': layer, 'meth': meth});
        }
      }

    }

    // TODO: draw a circle representing the query area ?

  },

  /* Private: perform a clik on map... */
  trigger: function(evt) {

    if ( ! evt ) return;

    this.prepareQuery(evt);

    /* Query layers */
    for (var i=0, len=this.queryLayers.length; i<len; ++i) {
      var layer = this.queryLayers[i];
      var meth = layer.meth;
      this[meth](evt, layer);
    }
  },

  addLayerInfo: function(querylayer, info) {

    var layer = querylayer.layer;
    this.layerInfo.push({'layer': layer, 'info': info});

    if (this.layerInfo.length >= this.queryLayers.length) {
      Drupal.theme('dolppQueryResultHandler', this, this.map, this.queryPixel,
        this.layerInfo);
    } 

    // TODO: debug log when getting called past the expected number of times ?
  },

  /* private
   *
   * Perform query against a WMS layer
   *
   * @param querylayer internal structure containing
   *                   informations about the layer to query
   */
  queryWMSLayer: function(evt, querylayer) {

    var layer = querylayer.layer;

    // TODO: add request for possibly multiple-features
    // TODO2: try to ask for a tolerance (but WMS spec don't mention that)
    var url = layer.getFullRequestString({
      REQUEST: "GetFeatureInfo",
      EXCEPTIONS: "application/vnd.ogc.se_xml",
      BBOX: layer.map.getExtent().toBBOX(),
      X: evt.xy.x,
      Y: evt.xy.y,
      INFO_FORMAT: 'text/html',
      QUERY_LAYERS: layer.params.LAYERS,
      WIDTH: layer.map.size.w,
      HEIGHT: layer.map.size.h
    });

    var request = null
    try {
      request = OpenLayers.Request.GET({
        url: url,
        callback: function(req) {

          /*  Remove timeout, if any */
          if ( querylayer.timeout ) {
            window.clearTimeout(querylayer.timeout);
            delete querylayer.timeout;
          }

          // see http://docs.openlayers.org/library/request.html
          var info = '';
          if ( req.status == 200 ) {
            // extract just the body content
            var match = req.responseText.match(/<body[^>]*>([\s\S]*)<\/body>/);
            if (match && !match[1].match(/^\s*$/)) {
              info += match[1];
            }
          } else if ( req.status == 404 ) {
            // Nothing here (this is expected for no query results)
            // altought it'd be hard to tell apart from a bogus url..
            //info += req.status+" response from server";
          } else if ( req.status == 0 ) {
            // This seems to be a cross-origin issue
            info += req.status+" response from server (need a proxy?)";
          } else {
            // Unexpected ... what else could it be ?
            info += req.status+" response from server";
          }
          this.addLayerInfo(querylayer, info);
        },
        scope: this
        //, proxy: <proxy_here>, or defaults to OpenLayers.ProxyHost
        //                       which can be set on a preset-basis
      });

      querylayer.request = request;
      var timeoutHandler = function() {
        if ( querylayer.request ) {
          //console.log("Aborting request");
          querylayer.request.abort();
        }
        this.addLayerInfo(querylayer, '-timeout-');
      }


      /*  Add timeout */
      querylayer.timeout = window.setTimeout(
        OpenLayers.Function.bind( timeoutHandler, this ),
        this.timeout );

    } catch (e) {

      this.addLayerInfo(querylayer,
        'Could not query layer "'+layer.name+'": ' + e + ' (need proxy?)');

    }

  },

  /* private
   *
   * Perform query against a Vector layer
   * requires 'this.queryPoint' and 'this.tolerance' being set,
   * which are taken care of by 'this.prepareQuery'
   *
   * @param querylayer internal structure containing
   *                   informations about the layer to query
   */
  queryVectorLayer: function(evt, querylayer) {
    
    var layer = querylayer.layer;
    var info = [];

    for(var i=0, len=layer.features.length; i<len; ++i)  {
      var feature = layer.features[i];
      var dist = this.queryPoint.distanceTo(feature.geometry);
      if ( dist <= this.tolerance ) {
        //info.push('Distant: '+dist);
        info.push(Drupal.theme('dolppFeatureInfo', feature));
        if ( this.doHighlight ) this.highlightLike(feature);
      }
    }

    this.addLayerInfo(querylayer, info.join(''));
  },

  unhighlightLayer: function(layer) {
      for(var i=layer.selectedFeatures.length-1; i>=0; --i) {
        feature = layer.selectedFeatures[i];
        this.unhighlight(feature);
      }
      layer.selectedFeatures = [];
      layer.selectedFIDS = [];
  },

  unhighlightAll: function() {
    var clayers = this.getCandidateLayers();
    for (var i=0, len=clayers.length; i<len; ++i) {
      var layer = clayers[i];
      if ( layer.CLASS_NAME !== 'OpenLayers.Layer.Vector' ) continue;
      this.unhighlightLayer(layer);
    }
  },

  doHighlight: false, // parametrize!

  selectStyle: 'select',

  /* Get an index of drupal fids contained in the given feature
   * (possibly clustered)
   */
  getDrupalFids: function(feature) {
    var fids = [];
    if ( ! feature.cluster ) {
      if ( feature.drupalFID != undefined ) {
        if ( ! fids[feature.drupalFID] ) {
          fids[feature.drupalFID] = 1;
        }
      }
    }
    else {
      for(var i = 0; i < feature.cluster.length; i++) {
        var pf = feature.cluster[i]; // pseudo-feature
        if ( pf.drupalFID != undefined ) {
          if ( ! fids[feature.drupalFID] ) {
            fids[pf.drupalFID] = 1;
          }
        }
      }
    }
    return fids;
  },

  // @param candidate A feature
  // @param fids An index of drupalFIDs numbers
  hasAnyFID: function(candidate, fids) {
    if ( ! candidate.cluster ) {
      return fids[candidate.drupalFID] !== undefined;
    } else {
      for(var i = 0; i < candidate.cluster.length; i++) {
        var pf = candidate.cluster[i]; // pseudo-feature
        if ( fids[pf.drupalFID] !== undefined ) return true;
      }
      return false;
    }
  },

  rehighlightLayer: function(layer) {
      var fids = layer.selectedFIDS;
      this.unhighlightLayer(layer);
      if ( typeof(fids) !== 'undefined' ) {
        this.highlightByFIDS(layer, fids);
      }
  },

  rehighlightAll: function() {
    var clayers = this.getCandidateLayers();
    for (var i=0, len=clayers.length; i<len; ++i) {
      var layer = clayers[i];
      if ( layer.CLASS_NAME !== 'OpenLayers.Layer.Vector' ) continue;
      this.rehighlightLayer(layer);
    }
  },

  zoomend: function() {
    this.rehighlightAll();
  },

  deactivate: function () {
    this.map.events.unregister("zoomend", this, this.zoomend);
    OpenLayers.Control.prototype.deactivate.apply(this,
      arguments);
  },

  activate: function() {
    OpenLayers.Control.prototype.activate.apply(this, arguments);

    // For clusters re-computation
    this.map.events.register("zoomend", this, this.zoomend);
  },

  highlightByFIDS: function(layer, fids) {
    for(var i = 0; i < layer.features.length; i++) {
      var candidate = layer.features[i];
      if ( this.hasAnyFID(candidate, fids) ) {
        this.highlight(candidate);
      }
    }
    layer.selectedFIDS = fids;
  },

  highlightLike: function(sample) {

    var fids = this.getDrupalFids(sample);
    if ( fids.length == 0 ) {
      // No drupalFID, we'll highlight this
      // feature only.
      highlight(sample);
      return;
    }

    // TODO: optionally refuse to highlight 
    //       multi-fid clusters
    // if ( theOption && fids.length > 1 );

    var layer = sample.layer;
    this.highlightByFIDS(layer, fids);
  },

  highlight: function(feature) {
    var style = this.selectStyle || this.renderIntent;
    var layer = feature.layer;
    layer.drawFeature(feature, style);
    layer.selectedFeatures.push(feature);
  },

  unhighlight: function(feature) {
    var style = feature.style || feature.layer.style || 'default';
    var layer = feature.layer;
    layer.drawFeature(feature, style);
  },

});

/* 
 * Thematic feature info formatter
 */
Drupal.theme.prototype.dolppFeatureInfo = function(feature) {
  var output = '';
  if(feature.cluster)
  {
    var visited = []; // to keep track of already-visited items
    for(var i=0, len=feature.cluster.length; i<len; ++i) {
      var pf = feature.cluster[i]; // pseudo-feature
      if ( typeof pf.drupalFID != 'undefined' ) {
        var mapwide_id = feature.layer.drupalID + pf.drupalFID;
        if (mapwide_id in visited) continue;
        visited[mapwide_id] = true;
      }
      output += '<div class="openlayers-query openlayers-query-feature">' +
        arguments.callee(pf) + '</div>';
    }
  }
  else
  {
    output =
      '<div class="openlayers-query openlayers-query-feature-name">' +
      feature.attributes.name +
      '</div>' +
      '<div class="openlayers-query openlayers-query-feature-description">' +
      feature.attributes.description +
      '</div>';
  }
  return output;
};

/* 
 * Thematic query result formatter
 */
Drupal.theme.prototype.dolppQueryResultFormatter = function(layerInfo)
{

    var content = [];

    for (var i=0, len=layerInfo.length; i<len; ++i) {
      var data = layerInfo[i];
      if ( data.info != '') {
        var info = [];
        info.push('<div class="openlayers-query openlayers-query-layer">');
        info.push('<div class="openlayers-query openlayers-query-layer-name">');
        info.push('<strong>' + data.layer.name + '</strong>');
        info.push('</div>');
        info.push(data.info);
        info.push('</div>');
        content.push(info.join(''));
      }
    }

    var html = content.join('<hr>');
    if ( html == '' ) html = 'Nothing here';

    return html;
}

/* 
 * Thematic query result presenter
 */
Drupal.theme.prototype.dolppQueryResultHandler = function(control, map,
   queryPixel, layerInfo)
{
    var html = Drupal.theme('dolppQueryResultFormatter', layerInfo);

    var popup = new OpenLayers.Popup.FramedCloud(
      'popup',
      queryPixel,
      null,
      html,
      null,
      true,
      function (e) {
        map.removePopup(map.queryPopup);
        control.unhighlightAll();
      }
    );
    if ( typeof map.queryPopup != 'undefined' ) {
      map.removePopup(map.queryPopup);
    }
    map.queryPopup = popup;
    map.addPopup(popup);

};

/**
 * Behavior for Query 
 */
Drupal.behaviors.dolpp_behavior_query = function(context) {

  var data = $(context).data('openlayers');
  if (data && data.map.behaviors['dolpp_behavior_query']) {

    var options = data.map.behaviors['dolpp_behavior_query'];

    var qlayers = [];
    for (var i=0; i<options.layers.length; i++) {
      var layer_id = options.layers[i];
      if ( layer_id !== 0 ) qlayers.push(layer_id);
    }

    var queryControl = new Drupal.openlayers.QueryControl({
      qlayers_id_field: 'drupalID',
      qlayers: qlayers,
      radius: parseInt(options.radius, 10),
      timeout: parseInt(options.timeout, 10),
      doHighlight: !!options.highlight,
      autoActivate: true
    });

    var map = data.openlayers;
    map.addControl(queryControl);
  }

};

