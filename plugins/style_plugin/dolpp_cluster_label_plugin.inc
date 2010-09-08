<?php
// $Id$

/**
 * @file
 * Test 
 */

// Define plugin for CTools
$plugin = array(
  'title' => t('Cluster population label'),
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
      'context_properties' => array(
        'label' => 'getLabel',
      )
    );
  }
  
  /**
   * Options form.
   */
  function options_form($defaults = array()) {
    $form = array();
    /* TODO: this is here just to workaround a conceptual bug
     *       in the style plugin form processor considering
     *       an empty options array as a sign of the plugin
     *       not being enabled. FIX upstream !
     */
    $form['fake'] = array(
      '#type' => 'hidden',
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
      $style->data[$prop] = '${' . 'dolpp_cluster_label_plugin_' . $callback . '}';
    }
    
    // Add JS
    drupal_add_js(drupal_get_path('module', 'dolpp') .
      '/plugins/style_plugin/dolpp_cluster_label_plugin.js');
  }
}
