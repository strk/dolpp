<?php
// $Id$

/**
 * @file
 * Implementation of OpenLayers behavior.
 */

/**
 * Query Behavior
 */
class dolpp_behavior_query extends openlayers_behavior {
  /**
   * Provide initial values for options.
   */
  function options_init() {
    return array(
    );
  }

  /**
   * Provide form for configurations per map.
   */
  function options_form($defaults) {

    // Build a list of supported layers
    // We support: vectors and WMS for now
    $queriable_layers = array();
    foreach ($this->map['layers'] as $id => $name) {
      $layer = openlayers_layer_load($id);
      if ( isset( $layer->data['vector'] )
           && $layer->data['vector'] == TRUE) {
        $queriable_layers[$id] = $name;
      }
      elseif ( isset( $layer->data['layer_handler'] )
                && $layer->data['layer_handler'] == 'wms' 
                && isset($layer->data['queryable']) 
                && $layer->data['queryable'] ) {
        $queriable_layers[$id] = $name;
      }
    }

    return array(
      'layers' => array(
        '#title' => t('Layers'),
        '#type' => 'checkboxes',
        '#options' => $queriable_layers,
        '#description' => t('Select layers to enable query on. Selecting NO layers will query ALL queriable layers.'),
        '#default_value' => isset($defaults['layers']) ? 
          $defaults['layers'] : array(),
      ),
      'radius' => array(
        '#title' => t('Query radius'),
        '#type' => 'textfield',
        '#default_value' => (isset($defaults['radius'])) ?
          $defaults['radius'] : 10,
        '#description' => t('Radius to use for the query, in pixels. This is currently only supported for vector layers as WMS specs do not allow for that.'),
      ),
      'timeout' => array(
        '#title' => t('Query timeout'),
        '#type' => 'textfield',
        '#default_value' => (isset($defaults['timeout'])) ?
          $defaults['timeout'] : 1000,
        '#description' => t('Timeout for WMS layer queries, in milliseconds.'),
      ),
      'highlight' => array(
        '#title' => t('Highlight selected'),
        '#type' => 'checkbox',
        '#default_value' => (isset($defaults['highlight'])) ?
          $defaults['highlight'] : 0,
        '#description' => t('Highlight vector features hit by the query.'),
      ),
    );
  }

  /**
   * Render.
   */
  function render(&$map) {
    drupal_add_css(drupal_get_path('module', 'dolpp') .
      '/behaviors/dolpp_behavior_query.css');
    drupal_add_js(drupal_get_path('module', 'dolpp') .
      '/behaviors/dolpp_behavior_query.js');
    return $this->options;
  }
}

