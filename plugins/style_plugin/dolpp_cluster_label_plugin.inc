<?php
// $Id$

/**
 * @file
 * Test 
 */

// Define plugin for CTools
$plugin = array(
  'title' => t('OL++ Cluster population label'),
  'description' => t('Style plugin for context styling.
    Sets label to number of features in cluster.'),
  'style_plugin' => array(
    'class' => 'dolpp_cluster_label_plugin',
    'parent' => 'openlayers_style_plugin',
  ),
);

/**
 * Style Plugin for testing purposes.
 */
class dolpp_cluster_label_plugin extends 
  openlayers_style_plugin {
  /**
   * Provide initial values for options.
   */
  function options_init() {
    return array(
    );
  }
  
  /**
   * Options form.
   */
  function options_form($defaults = array()) {
    $form = array();
    return $form;
  }

  /**
   * Get an array of style property callbacks
   */
  function get_context_properties() {
    return array(
        'label' => 'getLabel',
    );
  }

  /**
   * Render function
   */
  function render() {
    // Add JS
    drupal_add_js(drupal_get_path('module', 'dolpp') .
      '/plugins/style_plugin/dolpp_cluster_label_plugin.js');
  }
}
