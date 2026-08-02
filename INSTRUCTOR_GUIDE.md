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

### Intended learning point

AI is especially useful for translating clear cleaning rules into functions such as `DISTINCT`, `TRIM`, `REPLACE`, `CAST`, and `SUM`. Students still need to state the cleaning rules and verify the total.

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

## Intended timing

1. Cleaning challenge: about 2 minutes
2. Campaign SQL challenge: about 3 minutes
3. Python challenge: to be added
4. Visualization challenge: to be added

## File separation

Cleaning code lives under `scripts/cleaning/`. Campaign SQL lives under `scripts/sql/`. Both use the shared browser SQL engine in `scripts/shared/sql-engine.js`.
