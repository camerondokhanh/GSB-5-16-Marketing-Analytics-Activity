# Instructor Guide

## Business question

Of Northstar's completed campaigns, which has the highest conversion rate?

Conversion rate = conversions / clicks.

## Correct answer

- Campaign ID: `C104`
- Clicks: 140
- Conversions: 35
- Conversion rate: 25%

`C105` has a higher conversion rate, but its status is `Draft`, so it is not eligible.

## Example valid SQL

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

## Intended flow

1. Student clicks each table name and decides which columns matter.
2. Student asks an AI assistant to help write a query.
3. Student runs SQL and reviews the result.
4. Student submits only the campaign ID.

The challenge is intended to take about three minutes.
