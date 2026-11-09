import { BadRequestException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  const prisma = { $transaction: jest.fn() };
  const service = new TransactionsService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('rejects duplicate materials before changing stock', async () => {
    expect(() => service.create('OUT', {
      hubId: 'hub-1',
      items: [
        { materialId: 'material-1', quantity: 1 },
        { materialId: 'material-1', quantity: 2 },
      ],
    }, 'user-1')).toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('requires a different destination hub for transfer', async () => {
    expect(() => service.create('TRANSFER', {
      hubId: 'hub-1',
      destinationHubId: 'hub-1',
      items: [{ materialId: 'material-1', quantity: 1 }],
    }, 'user-1')).toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects the entire KIT issue when any required material is short', async () => {
    const tx = {
      hub: { findFirst: jest.fn().mockResolvedValue({ id: 'hub-1' }) },
      kit: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'kit-1',
          code: 'KIT1',
          items: [{
            materialId: 'material-1',
            quantity: 2,
            material: { code: 'VT-001', name: 'Test material', unit: 'Cái' },
          }],
        }),
      },
      stock: {
        findMany: jest.fn().mockResolvedValue([{ materialId: 'material-1', quantity: 1 }]),
        updateMany: jest.fn(),
      },
      stockTransaction: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(async (callback: (client: typeof tx) => unknown) => callback(tx));

    await expect(service.createKitOut({
      hubId: 'hub-1',
      kitId: 'kit-1',
      kitQuantity: 1,
    }, 'user-1')).rejects.toThrow('Không đủ tồn kho');
    expect(tx.stock.updateMany).not.toHaveBeenCalled();
    expect(tx.stockTransaction.create).not.toHaveBeenCalled();
  });

  it('requires a different destination hub for KIT transfer', () => {
    expect(() => service.createKitTransfer({
      hubId: 'hub-1',
      destinationHubId: 'hub-1',
      kitId: 'kit-1',
      kitQuantity: 1,
    }, 'user-1')).toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
