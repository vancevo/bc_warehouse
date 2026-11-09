import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const hubs = [
  { code: 'D7', name: 'Hub Quận 7' },
  { code: 'D10', name: 'Hub Quận 10' },
  { code: 'BT', name: 'Hub Bình Thạnh' },
  { code: 'TP', name: 'Hub Tân Phú' },
  { code: 'GV', name: 'Hub Gò Vấp' },
];

const materials = [
  ['VT-001', 'Dây kẹp cá sấu / Alligator clips', 'Dây & kết nối', 'Sợi', 'Dùng chung KIT1 và KIT2, hai sheet cùng kiểm kê 105 sợi.'],
  ['VT-002', 'Jumper Wire (M-M)', 'Dây & kết nối', 'Sợi', null],
  ['VT-003', '10mm DIP LED White', 'LED & ánh sáng', 'Cái', null],
  ['VT-004', 'LED Blue', 'LED & ánh sáng', 'Cái', null],
  ['VT-005', 'LED Green', 'LED & ánh sáng', 'Cái', null],
  ['VT-006', 'LED Orange', 'LED & ánh sáng', 'Cái', null],
  ['VT-007', 'LED RED', 'LED & ánh sáng', 'Cái', null],
  ['VT-008', 'LED RGB', 'LED & ánh sáng', 'Cái', 'KIT1 có 2 dòng RGB LED (3 + 4 cái/HS); chỉ 34 cái tồn kho, không phải 68.'],
  ['VT-009', 'LED White', 'LED & ánh sáng', 'Cái', null],
  ['VT-010', 'Triclour LED', 'LED & ánh sáng', 'Cái', 'KIT1: 34 ĐỤC'],
  ['VT-011', '9V Battery', 'Nguồn & pin', 'Cục', null],
  ['VT-012', '9V Battery holder (Aligator one)', 'Nguồn & pin', 'Cái', null],
  ['VT-013', 'Battery holder AA (Aligator one)', 'Nguồn & pin', 'Cái', null],
  ['VT-014', 'Lithium Cell 1225 3V', 'Nguồn & pin', 'Cục', 'KIT1: Tên Việt nguồn để trống; tên này suy theo cột tên gốc.'],
  ['VT-015', 'PinAA', 'Nguồn & pin', 'Cục', 'KIT1: có sẵn tại hub'],
  ['VT-016', 'Solar Panel 6 V (Heavy Quality)', 'Nguồn & pin', 'Tấm', null],
  ['VT-017', 'Đế pin 9v không hộp', 'Nguồn & pin', 'Cái', null],
  ['VT-018', 'Copper tape', 'Vật tư lắp ráp', 'Cuộn', 'KIT1: 4 used, 3 new'],
  ['VT-019', 'Double side tape', 'Vật tư lắp ráp', 'Cuộn', 'KIT2: có sẵn tại hub | Không có link Shopee trong file mẫu.'],
  ['VT-020', 'Hộp đựng / Box', 'Vật tư lắp ráp', 'Cái', 'TẠM GỘP: Hộp KIT1 và hộp KIT2 cùng ghi 13; xác minh kích cỡ trước khi xuất.'],
  ['VT-021', 'ICE Cream stick', 'Vật tư lắp ráp', 'Que', "CẦN ĐỐI CHIẾU: ghi chú '14 thực' khác SL kiểm kê 64; GIỮ 64 theo ô nguồn."],
  ['VT-022', 'Insulation Tape', 'Vật tư lắp ráp', 'Cuộn', null],
  ['VT-023', 'Nhôm tấm / Aluminium', 'Vật tư lắp ráp', 'Miếng', 'TẠM GỘP: Nhôm KIT1 và nhôm trắng sữa 25x25 KIT2 cùng ghi 10; cần xác minh.'],
  ['VT-024', 'OHP sheet A4', 'Vật tư lắp ráp', 'Tờ', null],
  ['VT-025', 'Paper Clip', 'Vật tư lắp ráp', 'Cái', "CẦN ĐỐI CHIẾU: ghi chú 'Chưa có, nên order' khác SL kiểm kê 50; GIỮ 50 theo ô nguồn."],
  ['VT-026', 'Sun Board', 'Vật tư lắp ráp', 'Tấm', null],
  ['VT-027', 'Buzzer Big 27V', 'Điện tử & điều khiển', 'Cái', null],
  ['VT-028', 'Buzzer Small 24V', 'Điện tử & điều khiển', 'Cái', null],
  ['VT-029', 'Diode', 'Điện tử & điều khiển', 'Cái', null],
  ['VT-030', 'Micro:bit', 'Điện tử & điều khiển', 'Cái', null],
  ['VT-031', 'On / Off switch', 'Điện tử & điều khiển', 'Cái', null],
  ['VT-032', 'Potentiometer 470 Ohm with nob', 'Điện tử & điều khiển', 'Cái', null],
  ['VT-033', 'Push Button', 'Điện tử & điều khiển', 'Cái', null],
  ['VT-034', 'Resistor 220 Ohm', 'Điện tử & điều khiển', 'Cái', null],
  ['VT-035', 'Resistor 330 Ohm', 'Điện tử & điều khiển', 'Cái', null],
  ['VT-036', 'Toggle Switch', 'Điện tử & điều khiển', 'Cái', null],
  ['VT-037', 'BO Motor', 'Động cơ & cơ khí', 'Cái', null],
  ['VT-038', 'BO Motor Wheel', 'Động cơ & cơ khí', 'Cái', null],
  ['VT-039', 'DC motor (Toy DC motor)', 'Động cơ & cơ khí', 'Cái', null],
  ['VT-040', 'Dc motor flat base (for solar panel)', 'Động cơ & cơ khí', 'Cái', null],
  ['VT-041', 'Propeller / Fan Type-1 (80mm)', 'Động cơ & cơ khí', 'Cái', null],
  ['VT-042', 'Propeller / Fan Type-2', 'Động cơ & cơ khí', 'Cái', 'KIT1: 23 quạt nhỏ 60mm, gồm 4 quạt xanh và 19 quạt vàng.'],
  ['VT-043', 'Screw', 'Động cơ & cơ khí', 'Cái', 'KIT1: Đã có theo động cơ'],
  ['VT-044', 'screwdriver', 'Động cơ & cơ khí', 'Cái', null],
  ['VT-045', 'Servo Motor SG90', 'Động cơ & cơ khí', 'Cái', null],
] as const;

// Số dư đầu kỳ theo cột "Tồn sau xuất KIT" của sheet KHO TỔNG.
// Người dùng xác nhận toàn bộ số lượng này thuộc hub D7.
const d7OpeningStock: Record<string, number> = {
  'VT-001': 105,
  'VT-002': 48,
  'VT-003': 5,
  'VT-004': 59,
  'VT-005': 75,
  'VT-006': 58,
  'VT-007': 68,
  'VT-008': 34,
  'VT-009': 29,
  'VT-010': 27,
  'VT-011': 5,
  'VT-012': 21,
  'VT-013': 10,
  'VT-014': 25,
  'VT-015': 8,
  'VT-016': 13,
  'VT-017': 7,
  'VT-018': 7,
  'VT-019': 5,
  'VT-020': 13,
  'VT-021': 64,
  'VT-022': 2,
  'VT-023': 10,
  'VT-024': 8,
  'VT-025': 50,
  'VT-026': 8,
  'VT-027': 4,
  'VT-028': 4,
  'VT-029': 102,
  'VT-030': 12,
  'VT-031': 8,
  'VT-032': 4,
  'VT-033': 13,
  'VT-034': 46,
  'VT-035': 27,
  'VT-036': 6,
  'VT-037': 10,
  'VT-038': 22,
  'VT-039': 2,
  'VT-040': 2,
  'VT-041': 2,
  'VT-042': 23,
  'VT-043': 4,
  'VT-044': 4,
  'VT-045': 12,
};

const D7_OPENING_TRANSACTION_NO = 'OPENING-D7-EXCEL-V6';

const kitDefinitions = [
  {
    code: 'KIT1',
    name: 'MakerJugadJack',
    items: {
      'VT-001': 10, 'VT-003': 1, 'VT-004': 4, 'VT-005': 4, 'VT-006': 4,
      'VT-007': 4, 'VT-008': 7, 'VT-009': 4, 'VT-010': 3, 'VT-011': 1,
      'VT-012': 2, 'VT-013': 2, 'VT-014': 1, 'VT-015': 2, 'VT-016': 2,
      'VT-017': 1, 'VT-018': 1, 'VT-020': 1, 'VT-021': 10, 'VT-022': 1,
      'VT-023': 1, 'VT-024': 1, 'VT-025': 5, 'VT-026': 2, 'VT-027': 1,
      'VT-028': 1, 'VT-029': 5, 'VT-031': 2, 'VT-032': 1, 'VT-033': 2,
      'VT-034': 5, 'VT-035': 5, 'VT-036': 1, 'VT-037': 2, 'VT-038': 4,
      'VT-039': 1, 'VT-040': 1, 'VT-041': 1, 'VT-042': 1, 'VT-043': 1,
      'VT-044': 1,
    },
  },
  {
    code: 'KIT2',
    name: 'GadgetJenius / Micro:bit',
    items: {
      'VT-001': 10,
      'VT-002': 10,
      'VT-019': 1,
      'VT-020': 1,
      'VT-023': 1,
      'VT-030': 1,
      'VT-045': 1,
    },
  },
] as const;

async function main() {
  for (const hub of hubs) {
    await prisma.hub.upsert({ where: { code: hub.code }, update: { name: hub.name, active: true }, create: hub });
  }

  for (const [code, name, category, unit, note] of materials) {
    await prisma.material.upsert({
      where: { code },
      update: {},
      create: { code, name, category, unit, note },
    });
  }

  const materialRows = await prisma.material.findMany({ select: { id: true, code: true } });
  const materialByCode = new Map(materialRows.map((material) => [material.code, material.id]));
  for (const definition of kitDefinitions) {
    const kit = await prisma.kit.upsert({
      where: { code: definition.code },
      update: { name: definition.name, active: true },
      create: { code: definition.code, name: definition.name },
    });
    for (const [materialCode, quantity] of Object.entries(definition.items)) {
      const materialId = materialByCode.get(materialCode);
      if (!materialId) throw new Error(`Không tìm thấy vật tư ${materialCode} cho ${definition.code}.`);
      await prisma.kitItem.upsert({
        where: { kitId_materialId: { kitId: kit.id, materialId } },
        update: { quantity },
        create: { kitId: kit.id, materialId, quantity },
      });
    }
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (adminEmail && initialPassword) {
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: adminEmail,
          fullName: 'Warehouse Administrator',
          passwordHash: await hash(initialPassword, 12),
          role: 'ADMIN',
          status: 'APPROVED',
          mustChangePassword: true,
          reviewedAt: new Date(),
        },
      });
      console.log(`Created initial admin: ${adminEmail}`);
    }
  } else {
    console.log('Skipped initial admin creation: ADMIN_EMAIL or ADMIN_INITIAL_PASSWORD is missing.');
  }

  const admin = adminEmail ? await prisma.user.findUnique({ where: { email: adminEmail } }) : null;
  const d7 = await prisma.hub.findUnique({ where: { code: 'D7' } });
  const existingOpening = await prisma.stockTransaction.findUnique({
    where: { transactionNo: D7_OPENING_TRANSACTION_NO },
  });

  if (admin && d7 && !existingOpening) {
    const openingMaterials = await prisma.material.findMany({
      where: { code: { in: Object.keys(d7OpeningStock) } },
      select: { id: true, code: true },
    });
    if (openingMaterials.length !== Object.keys(d7OpeningStock).length) {
      throw new Error('Không đủ vật tư để tạo số dư đầu kỳ D7.');
    }

    await prisma.$transaction(async (tx) => {
      for (const material of openingMaterials) {
        await tx.stock.upsert({
          where: { hubId_materialId: { hubId: d7.id, materialId: material.id } },
          update: { quantity: d7OpeningStock[material.code] },
          create: { hubId: d7.id, materialId: material.id, quantity: d7OpeningStock[material.code] },
        });
      }
      await tx.stockTransaction.create({
        data: {
          transactionNo: D7_OPENING_TRANSACTION_NO,
          type: 'ADJUSTMENT',
          status: 'POSTED',
          hubId: d7.id,
          transactionDate: new Date('2026-11-09T00:00:00.000+07:00'),
          counterparty: 'Kiểm kê kho từ Excel',
          note: 'Số dư đầu kỳ hub D7 theo cột Tồn sau xuất KIT của Material Version 6.',
          createdById: admin.id,
          items: {
            create: openingMaterials.map((material) => ({
              materialId: material.id,
              quantity: d7OpeningStock[material.code],
            })),
          },
        },
      });
    });
    console.log(`Created D7 opening balance for ${openingMaterials.length} materials.`);
  } else if (existingOpening) {
    console.log('Skipped D7 opening balance: transaction already exists.');
  } else {
    console.log('Skipped D7 opening balance: initial admin or D7 hub is missing.');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
