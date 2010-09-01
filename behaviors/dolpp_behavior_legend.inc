<?php
// $Id$

/**
 * @file
 * Implementation of OpenLayers behavior.
 */

/**
 * Legend Behavior
 */
class dolpp_behavior_legend extends openlayers_behavior {
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
    // We support: WMS 
    $supported_layers = array();
    foreach ($this->map['layers'] as $id => $name) {
      $layer = openlayers_layer_load($id);
      if ( isset( $layer->data['layer_handler'] )
                && $layer->data['layer_handler'] == 'wms'
                && $layer->data['params']['hasLegend'] ) {
        $supported_layers[$id] = $name;
      }
    }

    return array(
      'layers' => array(
        '#title' => t('Layers'),
        '#type' => 'checkboxes',
        '#options' => $supported_layers,
        '#description' => t('Select layers to show legend of. Selecting NO layers will show legend of ALL layers having one.'),
        '#default_value' => isset($defaults['layers']) ? 
          $defaults['layers'] : array(),
      ),
    );
  }

  /**
   * Render.
   */
  function render(&$map) {
/*
    drupal_add_css(drupal_get_path('module', 'dolpp') .
      '/behaviors/dolpp_behavior_legend.css');
*/
    drupal_add_js(drupal_get_path('module', 'dolpp') .
      '/behaviors/dolpp_behavior_legend.js');
    return $this->options;
  }
}

