<?php
// $Id$

/**
 * @file
 * Test 
 */

// Define plugin for CTools
$plugin = array(
  'title' => t('OL++ Cluster-safe attribute label'),
  'description' => t('Style plugin for context styling. '.
    'Sets label to given attribute, if defined.'),
  'style_plugin' => array(
    'class' => 'dolpp_cluster_safe_attribute_label_plugin',
    'parent' => 'openlayers_style_plugin',
  ),
);

/**
 * Style Plugin for testing purposes.
 */
class dolpp_cluster_safe_attribute_label_plugin extends 
  openlayers_style_plugin {
  /**
   * Provide initial values for options.
   */
  function options_init() {
    return array(
	'attribute_name' => ''
    );
  }
  
  /**
   * Options form.
   */
  function options_form($defaults = array()) {
    $form = array();

    $form['attribute_name'] = array(
      '#type' => 'textfield',
      '#title' => t('Attribute'),
      '#description' => t('Name of the attribute to show in label'),
      '#default_value' => isset($defaults['attribute_name']) ?
        $defaults['attribute_name'] : '',
    );

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
      '/plugins/style_plugin/dolpp_cluster_safe_attribute_label_plugin.js');
  }
}
