(() => {
  'use strict';

  const baseRows = [
    { transaction_id: 'T001', campaign_id: 'C101', channel: 'Email', revenue: '$1,200.00', converted: 1, is_test_record: 0, export_note: 'Imported' },
    { transaction_id: 'T002', campaign_id: 'C101', channel: 'Email', revenue: '850', converted: 1, is_test_record: 0, export_note: 'Imported' },
    { transaction_id: 'T003', campaign_id: 'C102', channel: 'Social', revenue: '$950.00', converted: 1, is_test_record: 0, export_note: 'Imported' },
    { transaction_id: 'T003', campaign_id: 'C102', channel: 'Social', revenue: '$950.00', converted: 1, is_test_record: 0, export_note: 'Imported' },
    { transaction_id: 'T004', campaign_id: 'C103', channel: 'Search', revenue: 'N/A', converted: 0, is_test_record: 0, export_note: 'Missing revenue' },
    { transaction_id: 'T005', campaign_id: 'C104', channel: 'Email', revenue: '$1,500.00', converted: 1, is_test_record: 0, export_note: 'Imported' },
    { transaction_id: 'T006', campaign_id: 'C104', channel: 'Email', revenue: ' 700 ', converted: 1, is_test_record: 0, export_note: 'Extra spaces' },
    { transaction_id: 'T007', campaign_id: 'C105', channel: 'Display', revenue: '$2,000.00', converted: 1, is_test_record: 1, export_note: 'Test record' },
    { transaction_id: 'T008', campaign_id: 'C104', channel: 'Email', revenue: '$1,100.00', converted: 1, is_test_record: 0, export_note: 'Imported' },
    { transaction_id: 'T009', campaign_id: 'C102', channel: 'Social', revenue: '', converted: 0, is_test_record: 0, export_note: 'Blank revenue' },
    { transaction_id: 'T010', campaign_id: 'C103', channel: 'Search', revenue: '$625.00', converted: 1, is_test_record: 0, export_note: 'Imported' }
  ];

  const campaignChannels = [
    ['C101', 'Email'],
    ['C102', 'Social'],
    ['C103', 'Search'],
    ['C104', 'Email'],
    ['C105', 'Display'],
    ['C106', 'Referral']
  ];

  function formatRevenue(amount, rowNumber) {
    const formatted = amount.toLocaleString('en-US');

    switch (rowNumber % 6) {
      case 0:
        return `$${formatted}.00`;
      case 1:
        return ` ${amount} `;
      case 2:
        return String(amount);
      case 3:
        return `$${amount}.00`;
      case 4:
        return `${formatted}.00`;
      default:
        return ` $${formatted}.00 `;
    }
  }

  function makeGeneratedRow(rowNumber) {
    const [campaignId, channel] = campaignChannels[(rowNumber - 1) % campaignChannels.length];
    const amount = 180 + ((rowNumber * 73) % 1820);
    const isTest = rowNumber % 17 === 0 ? 1 : 0;

    let revenue = formatRevenue(amount, rowNumber);
    let converted = 1;
    let exportNote = 'Imported';

    if (rowNumber % 29 === 0) {
      revenue = 'N/A';
      converted = 0;
      exportNote = 'Missing revenue';
    } else if (rowNumber % 23 === 0) {
      revenue = '';
      converted = 0;
      exportNote = 'Blank revenue';
    } else if (rowNumber % 19 === 0) {
      revenue = '   ';
      converted = 0;
      exportNote = 'Whitespace revenue';
    } else if (rowNumber % 6 === 1) {
      exportNote = 'Extra spaces';
    } else if (rowNumber % 6 === 4) {
      exportNote = 'Comma formatting';
    }

    if (isTest) {
      exportNote = 'Test record';
    }

    return {
      transaction_id: `T${String(rowNumber).padStart(3, '0')}`,
      campaign_id: campaignId,
      channel,
      revenue,
      converted,
      is_test_record: isTest,
      export_note: exportNote
    };
  }

  const generatedRows = [];
  for (let rowNumber = 11; rowNumber <= 170; rowNumber += 1) {
    generatedRows.push(makeGeneratedRow(rowNumber));
  }

  // Add 29 exact duplicates throughout the export. Together with the original
  // duplicate T003, the 200-row table contains 30 repeated transactions.
  const duplicateRows = generatedRows
    .filter((_, index) => index % 5 === 1)
    .slice(0, 29)
    .map((row) => ({ ...row }));

  const cleaningData = [...baseRows, ...generatedRows, ...duplicateRows];

  function parseRevenue(value) {
    const normalized = String(value).replace(/[$,\s]/g, '');
    if (!normalized || normalized.toUpperCase() === 'N/A') return NaN;
    return Number(normalized);
  }

  function calculateCorrectTotal(rows) {
    const seenTransactionIds = new Set();
    let total = 0;

    rows.forEach((row) => {
      if (seenTransactionIds.has(row.transaction_id)) return;
      seenTransactionIds.add(row.transaction_id);

      if (row.is_test_record === 1) return;

      const revenue = parseRevenue(row.revenue);
      if (Number.isFinite(revenue)) total += revenue;
    });

    return total;
  }

  window.MCCARTHYS_CLEANING_DATA = cleaningData;
  window.MCCARTHYS_CLEANING_CONFIG = {
    storageKey: 'mccarthys-cleaning-v2',
    starterSql: '-- Clean the revenue data and calculate the total valid revenue.\n',
    tableName: 'raw_campaign_revenue',
    correctTotal: calculateCorrectTotal(cleaningData)
  };
})();
