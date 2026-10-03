import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { pool } from '../src/server/db';

type SheetRows = { columns: string[]; rows: unknown[][] };
type KnowledgeBase = {
  knowledgeBaseVersion: string;
  sourceWorkbook: string;
  vehicle: { columns: string[]; row: unknown[] };
  oemReference: SheetRows;
  aftermarketReference: SheetRows;
  completionSummary: unknown[][];
  policy: { importAs: string; requiresVinOrEpc: boolean; doNotCreateSellableProducts: boolean };
};
type ReferenceRow = {
  reference_id: string;
  vehicle_id: string;
  reference_kind: string;
  component_id: string | null;
  system_code: string | null;
  system_name: string | null;
  assembly_name: string | null;
  part_name_fa: string | null;
  part_name_en: string | null;
  primary_oem: string | null;
  alternative_oem: string | null;
  variant_oems: string | null;
  aftermarket_brand: string | null;
  aftermarket_code: string | null;
  verification_status: string;
  oem_confidence: string | null;
  cross_reference_confidence: string | null;
  requires_vin: number;
  source_url: string | null;
  data_json: string;
};

const textValue = (record: Record<string, unknown>, key: string): string =>
  String(record[key] ?? '').trim();

const asRecord = (columns: string[], values: unknown[]): Record<string, unknown> =>
  Object.fromEntries(columns.map((column, index) => [column, values[index] ?? '']));

const nullable = (value: string): string | null => value || null;

const main = async () => {
  const archivePath = path.resolve(process.cwd(), 'data/catalog/lucano-l8-oem-reference.json.gz');
  const archive = await fs.readFile(archivePath);
  const knowledge = JSON.parse(gunzipSync(archive).toString('utf8')) as KnowledgeBase;
  const vehicle = asRecord(knowledge.vehicle.columns, knowledge.vehicle.row);
  const vehicleId = textValue(vehicle, 'Vehicle_ID');

  const rows: ReferenceRow[] = [];
  rows.push({
    reference_id: vehicleId,
    vehicle_id: vehicleId,
    reference_kind: 'vehicle_identity',
    component_id: null,
    system_code: null,
    system_name: null,
    assembly_name: null,
    part_name_fa: 'لوکانو L8',
    part_name_en: 'Lucano L8',
    primary_oem: null,
    alternative_oem: null,
    variant_oems: null,
    aftermarket_brand: null,
    aftermarket_code: null,
    verification_status: textValue(vehicle, 'Confidence') || 'SOURCE_RECORDED',
    oem_confidence: textValue(vehicle, 'Confidence') || null,
    cross_reference_confidence: null,
    requires_vin: 1,
    source_url: textValue(vehicle, 'Source_1') || null,
    data_json: JSON.stringify({
      knowledgeBaseVersion: knowledge.knowledgeBaseVersion,
      sourceWorkbook: knowledge.sourceWorkbook,
      referenceKind: 'vehicle_identity',
      sourceRecord: vehicle,
      fitmentPolicy: 'VIN/EPC confirmation required for exact part revision and fitment.'
    })
  });

  for (const values of knowledge.oemReference.rows) {
    const record = asRecord(knowledge.oemReference.columns, values);
    const componentId = textValue(record, 'Component_ID');
    if (!componentId) continue;
    rows.push({
      reference_id: componentId,
      vehicle_id: vehicleId,
      reference_kind: 'oem_reference',
      component_id: componentId,
      system_code: nullable(textValue(record, 'System_Code')),
      system_name: nullable(textValue(record, 'System')),
      assembly_name: nullable(textValue(record, 'Assembly')),
      part_name_fa: nullable(textValue(record, 'Part_Name_FA')),
      part_name_en: nullable(textValue(record, 'Part_Name_EN')),
      primary_oem: nullable(textValue(record, 'Primary_OEM')),
      alternative_oem: nullable(textValue(record, 'Alternative_OEM')),
      variant_oems: nullable(textValue(record, 'Variant_OEMs')),
      aftermarket_brand: null,
      aftermarket_code: null,
      verification_status: textValue(record, 'Verification_Status') || 'UNVERIFIED',
      oem_confidence: nullable(textValue(record, 'OEM_Confidence')),
      cross_reference_confidence: nullable(textValue(record, 'CrossRef_Confidence')),
      requires_vin: 1,
      source_url: nullable(textValue(record, 'Source_Primary') || textValue(record, 'Source_Secondary') || textValue(record, 'CrossRef_Source')),
      data_json: JSON.stringify({
        knowledgeBaseVersion: knowledge.knowledgeBaseVersion,
        sourceWorkbook: knowledge.sourceWorkbook,
        referenceKind: 'oem_reference',
        sourceRecord: record,
        fitmentPolicy: 'Reference only. Confirm VIN/EPC before sale or automatic compatibility.'
      })
    });
  }

  for (let index = 0; index < knowledge.aftermarketReference.rows.length; index++) {
    const record = asRecord(knowledge.aftermarketReference.columns, knowledge.aftermarketReference.rows[index]);
    const referenceId = `L8-AFT-${String(index + 1).padStart(4, '0')}`;
    rows.push({
      reference_id: referenceId,
      vehicle_id: vehicleId,
      reference_kind: 'aftermarket_cross',
      component_id: null,
      system_code: null,
      system_name: nullable(textValue(record, 'OEM_or_Vehicle_Basis')),
      assembly_name: null,
      part_name_fa: nullable(textValue(record, 'Part_Name_FA')),
      part_name_en: nullable(textValue(record, 'Part_Name_EN')),
      primary_oem: null,
      alternative_oem: null,
      variant_oems: null,
      aftermarket_brand: nullable(textValue(record, 'Aftermarket_Brand')),
      aftermarket_code: nullable(textValue(record, 'Aftermarket_Code')),
      verification_status: textValue(record, 'Status') || 'AFTERMARKET_CROSS',
      oem_confidence: null,
      cross_reference_confidence: null,
      requires_vin: 1,
      source_url: nullable(textValue(record, 'Source')),
      data_json: JSON.stringify({
        knowledgeBaseVersion: knowledge.knowledgeBaseVersion,
        sourceWorkbook: knowledge.sourceWorkbook,
        referenceKind: 'aftermarket_cross',
        sourceRecord: record,
        fitmentPolicy: 'Aftermarket code; not an OEM number. Confirm VIN/EPC before sale or automatic compatibility.'
      })
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const columns = [
      'reference_id', 'vehicle_id', 'reference_kind', 'component_id', 'system_code',
      'system_name', 'assembly_name', 'part_name_fa', 'part_name_en', 'primary_oem',
      'alternative_oem', 'variant_oems', 'aftermarket_brand', 'aftermarket_code',
      'verification_status', 'oem_confidence', 'cross_reference_confidence',
      'requires_vin', 'source_url', 'data_json'
    ];
    let inserted = 0;
    const batchSize = 50;
    for (let start = 0; start < rows.length; start += batchSize) {
      const batch = rows.slice(start, start + batchSize);
      const tuple = `(${columns.map(() => '?').join(',')})`;
      const sql = `INSERT IGNORE INTO vehicle_part_references (${columns.join(',')}) VALUES ${batch.map(() => tuple).join(',')}`;
      const params = batch.flatMap(row => columns.map(column => row[column as keyof ReferenceRow]));
      const [result] = await connection.execute<any>(sql, params);
      inserted += Number(result.affectedRows || 0);
    }
    await connection.commit();
    console.log(`Lucano L8 reference import complete: ${rows.length} records read, ${inserted} new records added. Existing reference edits are preserved; no products, prices, stock, or automatic fitments were created.`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
