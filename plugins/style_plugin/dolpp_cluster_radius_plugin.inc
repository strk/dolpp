<?php
// $Id$

/**
 * @file
 * Test 
 */

// Define plugin for CTools
$plugin = array(
  'title' => t('Cluster population radius'),
  'description' => t('Style plugin for context styling.
    Sets point radius based on number of features in cluster.'),
  'style_plugin' => array(
    'class' => 'dolpp_cluster_radius_plugin',
    'parent' => 'openlayers_style_plugin',
  ),
);

/**
 * Style Plugin for testing purposes.
 */
class dolpp_cluster_radius_plugin extends 
  openlayers_style_plugin {
  /**
   * Provide initial values for options.
   */
  function options_init() {
    return array(
      'context_properties' => array(
        'pointRadius' => 'getPointRadius',
      ),
      'feature_weight' => 2,
      'point_radius_min' => 6,
      'point_radius_max' => 12,
    );
  }
  
  /**
   * Options form.
   */
  function options_form($defaults = array()) {
    $form = array();
    
    $form['point_radius_min'] = array(
      '#type' => 'textfield',
      '#title' => t('Min radius'),
      '#description' => t('Minimum value for the point radius.'),
      '#default_value' => isset($defaults['point_radius_min']) ?
        $defaults['point_radius_min'] : 6,
    );
    $form['point_radius_max'] = array(
      '#type' => 'textfield',
      '#title' => t('Max radius'),
      '#description' => t('Maximum value for the point radius.'),
      '#default_value' => isset($defaults['point_radius_max']) ?
        $defaults['point_radius_max'] : 12,
    );
    $form['feature_weight'] = array(
      '#type' => 'textfield',
      '#title' => t('Feature weight'),
      '#description' => t('Weight of each additional feature for the final point radius.'),
      '#default_value' => isset($defaults['feature_weight']) ?
        $defaults['feature_weight'] : 2,
    );
    
    return $form;
  }

  /**
   * Render function
   */
  function render(&$style) {
    // For context styling, we want to replace the
    // style properties with their context value
    foreach ($this->options['context_properties'] as $prop => $callback) {
      $style->data[$prop] = '${' . 'dolpp_cluster_radius_plugin_' . $callback . '}';
    }
    
    // Add JS
    drupal_add_js(drupal_get_path('module', 'dolpp') .
      '/plugins/style_plugin/dolpp_cluster_radius_plugin.js');
  }
}
