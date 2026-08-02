window.NORTHSTAR_CLEANING_CONFIG = {
  storageKey: 'northstar-cleaning-v1',
  starterSql: '-- Clean the revenue data and calculate the total valid revenue.\n',
  tableName: 'raw_campaign_revenue',
  correctTotal: 6925
};

window.NORTHSTAR_CLEANING_DATA = [
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
