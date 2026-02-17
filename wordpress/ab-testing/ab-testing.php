<?php
/**
 * Plugin Name: AB Testing for Headless Next.js
 * Description: Lightweight A/B testing — define variants in ACF, track results via REST API.
 * Version: 1.0.0
 * Author: RK
 *
 * WHAT THIS PLUGIN DOES:
 * 1. Creates a custom DB table (wp_ab_events) for tracking
 * 2. Registers REST API endpoints for tracking + results
 * 3. Registers ACF field groups (if ACF is active)
 *
 * WHAT IT DOES NOT DO:
 * - No frontend JS (that's Next.js's job)
 * - No admin UI beyond ACF fields (dashboard is in Next.js)
 * - No cookies or redirects (middleware handles that)
 */

if (!defined('ABSPATH')) exit;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DATABASE TABLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

register_activation_hook(__FILE__, 'ab_testing_create_table');

function ab_testing_create_table() {
    global $wpdb;
    $table = $wpdb->prefix . 'ab_events';
    $charset = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE $table (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        post_id bigint(20) unsigned NOT NULL,
        variant_index smallint NOT NULL DEFAULT 0,
        event_type varchar(20) NOT NULL DEFAULT 'impression',
        event_name varchar(100) DEFAULT NULL,
        slug varchar(255) DEFAULT NULL,
        uid varchar(36) DEFAULT NULL,
        user_agent text DEFAULT NULL,
        referer varchar(500) DEFAULT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_post_variant (post_id, variant_index),
        KEY idx_event (event_type),
        KEY idx_created (created_at)
    ) $charset;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REST API ENDPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

add_action('rest_api_init', function () {

    // POST /wp-json/ab/v1/track
    // Record an impression, conversion, or custom event
    register_rest_route('ab/v1', '/track', [
        'methods'  => 'POST',
        'callback' => 'ab_testing_track',
        'permission_callback' => '__return_true', // Public (called from frontend)
    ]);

    // GET /wp-json/ab/v1/results/(?P<post_id>\d+)
    // Get aggregated results for a specific page
    register_rest_route('ab/v1', '/results/(?P<post_id>\d+)', [
        'methods'  => 'GET',
        'callback' => 'ab_testing_results',
        'permission_callback' => '__return_true', // Protect in production (add nonce or auth)
    ]);

    // GET /wp-json/ab/v1/results
    // Get results for ALL pages with active tests
    register_rest_route('ab/v1', '/results', [
        'methods'  => 'GET',
        'callback' => 'ab_testing_all_results',
        'permission_callback' => '__return_true',
    ]);

    // GET /wp-json/ab/v1/tests
    // List all pages that have AB variants defined
    register_rest_route('ab/v1', '/tests', [
        'methods'  => 'GET',
        'callback' => 'ab_testing_list_tests',
        'permission_callback' => '__return_true',
    ]);
});

/**
 * POST /wp-json/ab/v1/track
 *
 * Body: {
 *   post_id: 123,           // WordPress post/page ID
 *   variant_index: 1,       // Which variant (0 = control, 1+ = variants)
 *   event_type: "impression" // "impression", "conversion", or "event"
 *   event_name: "cta_click"  // Optional: for custom events
 *   slug: "/services/web"    // Optional: the Next.js URL
 *   uid: "abc-123-..."       // Optional: from ab-uid cookie
 * }
 */
function ab_testing_track($request) {
    global $wpdb;
    $table = $wpdb->prefix . 'ab_events';

    $params = $request->get_json_params();

    $post_id = absint($params['post_id'] ?? 0);
    $variant_index = absint($params['variant_index'] ?? 0);
    $event_type = sanitize_text_field($params['event_type'] ?? 'impression');
    $event_name = sanitize_text_field($params['event_name'] ?? '');
    $slug = sanitize_text_field($params['slug'] ?? '');
    $uid = sanitize_text_field($params['uid'] ?? '');

    if (!$post_id) {
        return new WP_Error('missing_post_id', 'post_id is required', ['status' => 400]);
    }

    // Validate event_type
    $allowed_events = ['impression', 'conversion', 'event'];
    if (!in_array($event_type, $allowed_events)) {
        return new WP_Error('invalid_event', 'event_type must be impression, conversion, or event', ['status' => 400]);
    }

    $wpdb->insert($table, [
        'post_id'       => $post_id,
        'variant_index' => $variant_index,
        'event_type'    => $event_type,
        'event_name'    => $event_name ?: null,
        'slug'          => $slug ?: null,
        'uid'           => $uid ?: null,
        'user_agent'    => sanitize_text_field($_SERVER['HTTP_USER_AGENT'] ?? ''),
        'referer'       => sanitize_text_field($_SERVER['HTTP_REFERER'] ?? ''),
    ]);

    return ['ok' => true];
}

/**
 * GET /wp-json/ab/v1/results/{post_id}
 *
 * Returns per-variant stats for a page:
 * {
 *   post_id: 123,
 *   title: "Services",
 *   variants: [
 *     { index: 0, label: "Control", impressions: 500, conversions: 25, rate: "5.0%", events: { cta_click: 30 } },
 *     { index: 1, label: "Variant B", impressions: 480, conversions: 38, rate: "7.9%", events: { cta_click: 45 } },
 *   ]
 * }
 */
function ab_testing_results($request) {
    global $wpdb;
    $table = $wpdb->prefix . 'ab_events';
    $post_id = absint($request['post_id']);

    $post = get_post($post_id);
    if (!$post) {
        return new WP_Error('not_found', 'Post not found', ['status' => 404]);
    }

    // Get variant labels from ACF
    $variants_acf = get_field('ab_variants', $post_id) ?: [];
    $variant_labels = ['Control']; // Index 0 is always control
    foreach ($variants_acf as $v) {
        $variant_labels[] = $v['ab_variant_name'] ?? ('Variant ' . count($variant_labels));
    }

    // Aggregate impressions + conversions per variant
    $stats = $wpdb->get_results($wpdb->prepare(
        "SELECT variant_index, event_type, COUNT(*) as count
         FROM $table
         WHERE post_id = %d AND event_type IN ('impression', 'conversion')
         GROUP BY variant_index, event_type",
        $post_id
    ));

    // Aggregate custom events per variant
    $events = $wpdb->get_results($wpdb->prepare(
        "SELECT variant_index, event_name, COUNT(*) as count
         FROM $table
         WHERE post_id = %d AND event_type = 'event' AND event_name IS NOT NULL
         GROUP BY variant_index, event_name",
        $post_id
    ));

    // Build response
    $variant_data = [];
    foreach ($stats as $row) {
        $idx = (int) $row->variant_index;
        if (!isset($variant_data[$idx])) {
            $variant_data[$idx] = ['impressions' => 0, 'conversions' => 0, 'events' => []];
        }
        $variant_data[$idx][$row->event_type . 's'] = (int) $row->count;
    }
    foreach ($events as $row) {
        $idx = (int) $row->variant_index;
        if (!isset($variant_data[$idx])) {
            $variant_data[$idx] = ['impressions' => 0, 'conversions' => 0, 'events' => []];
        }
        $variant_data[$idx]['events'][$row->event_name] = (int) $row->count;
    }

    $result = [
        'post_id' => $post_id,
        'title'   => $post->post_title,
        'slug'    => $post->post_name,
        'variants' => [],
    ];

    // Include all known variants (even if no data yet)
    $max_index = max(array_merge(array_keys($variant_data), [count($variant_labels) - 1]));
    for ($i = 0; $i <= $max_index; $i++) {
        $d = $variant_data[$i] ?? ['impressions' => 0, 'conversions' => 0, 'events' => []];
        $rate = $d['impressions'] > 0 ? round($d['conversions'] / $d['impressions'] * 100, 1) . '%' : '0%';
        $result['variants'][] = [
            'index'       => $i,
            'label'       => $variant_labels[$i] ?? "Variant $i",
            'impressions' => $d['impressions'],
            'conversions' => $d['conversions'],
            'rate'        => $rate,
            'events'      => $d['events'],
        ];
    }

    return $result;
}

/**
 * GET /wp-json/ab/v1/results
 * Returns results for all pages that have AB events
 */
function ab_testing_all_results($request) {
    global $wpdb;
    $table = $wpdb->prefix . 'ab_events';

    $post_ids = $wpdb->get_col("SELECT DISTINCT post_id FROM $table ORDER BY post_id");

    $results = [];
    foreach ($post_ids as $pid) {
        $request_mock = new WP_REST_Request();
        $request_mock['post_id'] = $pid;
        $results[] = ab_testing_results($request_mock);
    }

    return $results;
}

/**
 * GET /wp-json/ab/v1/tests
 * List all pages with AB variants defined in ACF
 */
function ab_testing_list_tests() {
    $posts = get_posts([
        'post_type'   => ['page', 'post'],
        'numberposts' => -1,
        'meta_query'  => [
            [
                'key'     => 'ab_variants',
                'compare' => 'EXISTS',
            ],
        ],
    ]);

    $tests = [];
    foreach ($posts as $post) {
        $variants = get_field('ab_variants', $post->ID);
        if (empty($variants)) continue;

        $tests[] = [
            'post_id'  => $post->ID,
            'title'    => $post->post_title,
            'slug'     => $post->post_name,
            'url'      => get_permalink($post),
            'variants' => count($variants) + 1, // +1 for control
        ];
    }

    return $tests;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACF FIELD REGISTRATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// If ACF is active, register the field group programmatically.
// You can also create these manually in ACF > Field Groups.

add_action('acf/init', 'ab_testing_register_acf_fields');

function ab_testing_register_acf_fields() {
    if (!function_exists('acf_add_local_field_group')) return;

    acf_add_local_field_group([
        'key'      => 'group_ab_testing',
        'title'    => 'A/B Test Variants',
        'fields'   => [
            // Instructions field
            [
                'key'   => 'field_ab_instructions',
                'label' => 'How A/B Testing Works',
                'name'  => '',
                'type'  => 'message',
                'message' => '<strong>Add variants below to start an A/B test on this page.</strong><br>
                    The original page content is always "Control" (Variant A).<br>
                    Each variant you add will be shown to an equal share of visitors.<br>
                    Leave fields empty to keep the original value for that field.<br>
                    <em>Remove all variants to stop the test.</em>',
            ],
            // Repeater: variants
            [
                'key'        => 'field_ab_variants',
                'label'      => 'Variants',
                'name'       => 'ab_variants',
                'type'       => 'repeater',
                'layout'     => 'block',
                'button_label' => 'Add Variant',
                'sub_fields' => [
                    [
                        'key'   => 'field_ab_variant_name',
                        'label' => 'Variant Name',
                        'name'  => 'ab_variant_name',
                        'type'  => 'text',
                        'placeholder' => 'e.g. "Shorter headline" or "Green CTA"',
                        'instructions' => 'A label for your reference (not shown to visitors)',
                    ],
                    [
                        'key'   => 'field_ab_title',
                        'label' => 'Title Override',
                        'name'  => 'ab_title',
                        'type'  => 'text',
                        'placeholder' => 'Leave empty to use original title',
                        'instructions' => 'Replaces the page title/headline',
                    ],
                    [
                        'key'   => 'field_ab_description',
                        'label' => 'Description Override',
                        'name'  => 'ab_description',
                        'type'  => 'textarea',
                        'rows'  => 3,
                        'placeholder' => 'Leave empty to use original',
                        'instructions' => 'Replaces the page description/subtitle',
                    ],
                    [
                        'key'   => 'field_ab_bg_image',
                        'label' => 'Background Image Override',
                        'name'  => 'ab_bg_image',
                        'type'  => 'image',
                        'return_format' => 'url',
                        'preview_size'  => 'medium',
                        'instructions'  => 'Replaces the hero/background image',
                    ],
                    [
                        'key'   => 'field_ab_bg_video',
                        'label' => 'Background Video Override',
                        'name'  => 'ab_bg_video',
                        'type'  => 'url',
                        'placeholder' => 'https://cdn.example.com/hero.mp4',
                        'instructions' => 'Replaces the hero/background video',
                    ],
                    [
                        'key'   => 'field_ab_cta_text',
                        'label' => 'CTA Text Override',
                        'name'  => 'ab_cta_text',
                        'type'  => 'text',
                        'placeholder' => 'e.g. "Start Free Trial"',
                        'instructions' => 'Replaces the main call-to-action button text',
                    ],
                    [
                        'key'   => 'field_ab_cta_url',
                        'label' => 'CTA URL Override',
                        'name'  => 'ab_cta_url',
                        'type'  => 'url',
                        'placeholder' => 'https://...',
                        'instructions' => 'Replaces the CTA link destination',
                    ],
                    [
                        'key'   => 'field_ab_redirect_url',
                        'label' => 'Redirect URL (for redirect tests)',
                        'name'  => 'ab_redirect_url',
                        'type'  => 'text',
                        'placeholder' => '/pricing-v2',
                        'instructions' => 'If set, visitors see this URL instead (rewrite — URL bar stays the same). Leave empty for content-only tests.',
                    ],
                ],
            ],
        ],
        'location' => [
            // Show on all pages and posts
            // Adjust this to limit which post types get A/B testing
            [
                ['param' => 'post_type', 'operator' => '==', 'value' => 'page'],
            ],
            [
                ['param' => 'post_type', 'operator' => '==', 'value' => 'post'],
            ],
        ],
        'position'   => 'normal',
        'style'      => 'default',
        'menu_order' => 100, // Show below main content
    ]);
}
