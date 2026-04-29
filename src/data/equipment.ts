export type Equipment = {
  code: string;
  name: string;
  area: string;
  bagian: string;
};

export const AREAS = ["Produksi", "Utilitas"] as const;

export const BAGIAN_BY_AREA: Record<string, string[]> = {
  Produksi: ["Line A", "Line B"],
  Utilitas: ["Boiler", "Gudang Teknik"],
};

export const EQUIPMENTS: Equipment[] = [
  { code: "EQ-PRD-A-001", name: "Conveyor Line A", area: "Produksi", bagian: "Line A" },
  { code: "EQ-PRD-A-002", name: "Mixer Line A", area: "Produksi", bagian: "Line A" },
  { code: "EQ-PRD-A-003", name: "Sealer Line A", area: "Produksi", bagian: "Line A" },
  { code: "EQ-PRD-B-001", name: "Conveyor Line B", area: "Produksi", bagian: "Line B" },
  { code: "EQ-PRD-B-002", name: "Dryer Line B", area: "Produksi", bagian: "Line B" },
  { code: "EQ-PRD-B-003", name: "Packing Unit Line B", area: "Produksi", bagian: "Line B" },
  { code: "EQ-UTL-BLR-001", name: "Boiler Unit 1", area: "Utilitas", bagian: "Boiler" },
  { code: "EQ-UTL-BLR-002", name: "Pompa Boiler", area: "Utilitas", bagian: "Boiler" },
  { code: "EQ-UTL-GDT-001", name: "Rak Sparepart A", area: "Utilitas", bagian: "Gudang Teknik" },
  { code: "EQ-UTL-GDT-002", name: "Forklift Gudang", area: "Utilitas", bagian: "Gudang Teknik" },
];

export function getEquipmentByCode(code: string): Equipment | undefined {
  return EQUIPMENTS.find((e) => e.code === code);
}

export function getEquipmentsBy(area: string, bagian: string): Equipment[] {
  return EQUIPMENTS.filter((e) => e.area === area && e.bagian === bagian);
}

export const MAINTENANCE_TYPES = [
  "Preventive",
  "Corrective",
  "Inspection",
  "Emergency",
] as const;

export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number];
