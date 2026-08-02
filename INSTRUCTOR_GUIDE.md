# Instructor Guide

## Challenge 1: Clean the revenue export

### Business question

What is Northstar's total valid revenue after the export is cleaned?

Students are told to:

1. Keep one row per transaction ID.
2. Exclude `is_test_record = 1`.
3. Remove dollar signs, commas, and spaces from revenue.
4. Ignore blank and `N/A` revenue.

### Correct answer

- Total valid revenue: `$6,925`

### Example valid SQL

```sql
WITH cleaned AS (
    SELECT DISTINCT
        transaction_id,
        campaign_id,
        channel,
        revenue,
        converted,
        is_test_record,
        export_note
    FROM raw_campaign_revenue
    WHERE is_test_record = 0
      AND TRIM(revenue) NOT IN ('', 'N/A')
)
SELECT
    SUM(
        CAST(
            REPLACE(
                REPLACE(TRIM(revenue), '$', ''),
                ',',
                ''
            ) AS REAL
        )
    ) AS total_valid_revenue
FROM cleaned;
```

## Challenge 2: Select the campaign

### Business question

Of Northstar's completed campaigns, which has the highest conversion rate?

Conversion rate = conversions / clicks.

### Correct answer

- Campaign ID: `C104`
- Clicks: 140
- Conversions: 35
- Conversion rate: 25%

`C105` has a higher conversion rate, but its status is `Draft`, so it is not eligible.

### Example valid SQL

```sql
SELECT
    c.campaign_id,
    c.campaign_name,
    p.clicks,
    p.conversions,
    ROUND(100.0 * p.conversions / p.clicks, 1) AS conversion_rate
FROM campaigns AS c
JOIN campaign_performance AS p
    ON c.campaign_id = p.campaign_id
WHERE c.status = 'Complete'
ORDER BY conversion_rate DESC;
```

### Handoff to Python

After the student submits `C104`, the site stores it as `selectedCampaign`. The Python challenge receives it as:

```python
previous_campaign
```

## Challenge 3: Choose an audience with Python

### Business question

For the campaign selected in SQL, which audience has the highest expected profit per contacted customer?

```text
Expected profit = predicted conversion rate × average order value × profit margin − contact cost
```

### Correct answer

- Segment: `High-Intent Subscribers`
- Expected profit per contacted customer: `$17.00`

### Starter-code bugs

The starter code contains exactly three intended bugs.

1. **Code-breaking bug:** `selected_campain` is misspelled. It should be `selected_campaign`.
2. **Business-logic bug:** contact cost is added. It must be subtracted.
3. **Business-logic bug:** `sorted()` ranks from low to high by default. It needs `reverse=True` so the strongest opportunity is first.

After fixing only the spelling error, the code runs but still recommends the wrong segment. This reinforces that running code is not necessarily correct code.

### Corrected Python

```python
import json

segment_data = json.loads(segment_data_json)
selected_campaign = previous_campaign

campaign_rows = [
    row for row in segment_data
    if row["campaign_id"] == selected_campaign
]

for row in campaign_rows:
    row["expected_profit"] = (
        row["predicted_conversion_rate"]
        * row["average_order_value"]
        * row["profit_margin"]
        - row["contact_cost"]
    )

ranked_segments = sorted(
    campaign_rows,
    key=lambda row: row["expected_profit"],
    reverse=True
)

recommended_segment = ranked_segments[0]["segment"]

print("Recommended segment:", recommended_segment)
print()
for row in ranked_segments:
    print(row["segment"], round(row["expected_profit"], 2))
```

### Expected corrected output

```text
Recommended segment: High-Intent Subscribers

High-Intent Subscribers 17.0
Returning Customers 10.0
Broad Prospects 7.0
Discount Seekers 6.5
```

## Intended timing

1. Cleaning challenge: about 2 minutes
2. Campaign SQL challenge: about 3 minutes
3. Python challenge: about 3 minutes
4. Visualization challenge: about 2 minutes once added

## Technical note

The Python challenge uses Pyodide to run real Python in the browser. It does not use pandas, which keeps the challenge simpler and avoids loading an additional package during the timed activity.
