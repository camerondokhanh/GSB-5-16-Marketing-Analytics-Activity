window.MCCARTHYS_PYTHON_CONFIG = {
  storageKey: 'mccarthys-python-challenge-v1',
  correctSegment: 'HIGHINTENTSUBSCRIBERS',
  correctDisplayName: 'High-Intent Subscribers',
  correctExpectedProfit: 17,
  starterCode: `import json

segment_data = json.loads(segment_data_json)
selected_campaign = previous_campaign

# Keep only rows for the campaign selected in SQL.
campaign_rows = [
    row for row in segment_data
    if row["campaign_id"] == selected_campain
]

# Expected profit per contacted customer:
# conversion rate × average order value × profit margin − contact cost
for row in campaign_rows:
    row["expected_profit"] = (
        row["predicted_conversion_rate"]
        * row["average_order_value"]
        * row["profit_margin"]
        + row["contact_cost"]
    )

# Put the strongest opportunity first.
ranked_segments = sorted(
    campaign_rows,
    key=lambda row: row["expected_profit"]
)

recommended_segment = ranked_segments[0]["segment"]

print("Recommended segment:", recommended_segment)
print()
for row in ranked_segments:
    print(row["segment"], round(row["expected_profit"], 2))
`
};

window.MCCARTHYS_PYTHON_DATA = [
  {
    campaign_id: 'C103',
    segment: 'Search Loyalists',
    audience_size: 520,
    predicted_conversion_rate: 0.22,
    average_order_value: 155,
    profit_margin: 0.52,
    contact_cost: 4.5,
    email_open_rate: 0.41,
    avg_site_visits: 8.2
  },
  {
    campaign_id: 'C103',
    segment: 'New Search Visitors',
    audience_size: 1100,
    predicted_conversion_rate: 0.13,
    average_order_value: 105,
    profit_margin: 0.38,
    contact_cost: 2.25,
    email_open_rate: 0.29,
    avg_site_visits: 3.8
  },
  {
    campaign_id: 'C103',
    segment: 'High-Value Searchers',
    audience_size: 310,
    predicted_conversion_rate: 0.28,
    average_order_value: 185,
    profit_margin: 0.56,
    contact_cost: 6.25,
    email_open_rate: 0.47,
    avg_site_visits: 10.1
  },
  {
    campaign_id: 'C103',
    segment: 'Price Researchers',
    audience_size: 760,
    predicted_conversion_rate: 0.16,
    average_order_value: 90,
    profit_margin: 0.31,
    contact_cost: 1.75,
    email_open_rate: 0.33,
    avg_site_visits: 6.4
  },
  {
    campaign_id: 'C104',
    segment: 'High-Intent Subscribers',
    audience_size: 420,
    predicted_conversion_rate: 0.25,
    average_order_value: 160,
    profit_margin: 0.5,
    contact_cost: 3,
    email_open_rate: 0.48,
    avg_site_visits: 11.4
  },
  {
    campaign_id: 'C104',
    segment: 'Broad Prospects',
    audience_size: 1450,
    predicted_conversion_rate: 0.2,
    average_order_value: 160,
    profit_margin: 0.5,
    contact_cost: 9,
    email_open_rate: 0.27,
    avg_site_visits: 4.1
  },
  {
    campaign_id: 'C104',
    segment: 'Returning Customers',
    audience_size: 680,
    predicted_conversion_rate: 0.2,
    average_order_value: 120,
    profit_margin: 0.5,
    contact_cost: 2,
    email_open_rate: 0.44,
    avg_site_visits: 8.7
  },
  {
    campaign_id: 'C104',
    segment: 'Discount Seekers',
    audience_size: 980,
    predicted_conversion_rate: 0.15,
    average_order_value: 100,
    profit_margin: 0.5,
    contact_cost: 1,
    email_open_rate: 0.36,
    avg_site_visits: 7.2
  },
  {
    campaign_id: 'C106',
    segment: 'Referral Advocates',
    audience_size: 390,
    predicted_conversion_rate: 0.3,
    average_order_value: 145,
    profit_margin: 0.48,
    contact_cost: 5.5,
    email_open_rate: 0.52,
    avg_site_visits: 9.8
  },
  {
    campaign_id: 'C106',
    segment: 'Friend Referrals',
    audience_size: 830,
    predicted_conversion_rate: 0.17,
    average_order_value: 115,
    profit_margin: 0.4,
    contact_cost: 2.75,
    email_open_rate: 0.35,
    avg_site_visits: 5.6
  },
  {
    campaign_id: 'C106',
    segment: 'Dormant Referrers',
    audience_size: 610,
    predicted_conversion_rate: 0.12,
    average_order_value: 125,
    profit_margin: 0.43,
    contact_cost: 1.5,
    email_open_rate: 0.31,
    avg_site_visits: 3.9
  },
  {
    campaign_id: 'C106',
    segment: 'Premium Referrals',
    audience_size: 260,
    predicted_conversion_rate: 0.26,
    average_order_value: 175,
    profit_margin: 0.54,
    contact_cost: 7,
    email_open_rate: 0.5,
    avg_site_visits: 10.7
  }
];
