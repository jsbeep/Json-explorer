// path: src/data/sampleData.ts
import type { BsonObjectId, MockSnapshot } from '../types/explorer';

export const ACTIVE_DATABASE = 'mongolive-dev';
const SNAPSHOT_VERSION = 1;

export const makeOid = (seed: string): BsonObjectId => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  const first = (hash >>> 0).toString(16).padStart(8, '0');
  const second = (Math.imul(hash ^ 0x9e3779b9, 0x85ebca6b) >>> 0).toString(16).padStart(8, '0');
  const third = (Math.imul(hash ^ 0xc2b2ae35, 0x27d4eb2f) >>> 0).toString(16).padStart(8, '0');

  return {
    $oid: `${first}${second}${third}`.slice(0, 24),
  };
};

const formatDate = (timestamp: number): string => new Date(timestamp).toISOString();

export const createSeedSnapshot = (): MockSnapshot => {
  const now = Date.now();
  const userSeeds = [
    { name: 'Ava Kim', role: 'admin' },
    { name: 'Minjun Park', role: 'editor' },
    { name: 'Sora Lee', role: 'viewer' },
    { name: 'Jisoo Choi', role: 'editor' },
    { name: 'Hana Yoon', role: 'viewer' },
    { name: 'Jun Seo', role: 'admin' },
    { name: 'Mina Jung', role: 'viewer' },
    { name: 'Taeyang Han', role: 'editor' },
    { name: 'Yuna Shin', role: 'viewer' },
    { name: 'Dohyun Lim', role: 'editor' },
  ] as const;

  const users = userSeeds.map((seed, index) => {
    const createdAt = formatDate(now - index * 86_400_000);
    return {
      _id: makeOid(`users-${index + 1}`),
      name: seed.name,
      email: `${seed.name.toLowerCase().replace(/\s+/g, '.')}@mongolive.dev`,
      role: seed.role,
      createdAt,
    };
  });

  const productSeeds = [
    { name: 'Cloud Mug', price: 18, stock: 120, tags: ['home', 'desk'] },
    { name: 'Orbit Lamp', price: 72, stock: 45, tags: ['lighting', 'office'] },
    { name: 'Focus Pad', price: 24, stock: 90, tags: ['stationery', 'productivity'] },
    { name: 'Halo Keyboard', price: 128, stock: 28, tags: ['hardware', 'premium'] },
    { name: 'Pulse Bottle', price: 29, stock: 150, tags: ['travel', 'fitness'] },
    { name: 'Frame Stand', price: 34, stock: 64, tags: ['accessory', 'home'] },
  ] as const;

  const products = productSeeds.map((seed, index) => ({
    _id: makeOid(`products-${index + 1}`),
    name: seed.name,
    price: seed.price,
    stock: seed.stock,
    tags: [...seed.tags],
  }));

  const orderStatuses = ['paid', 'pending', 'shipped', 'cancelled'] as const;
  const orders = Array.from({ length: 8 }, (_, index) => {
    const user = users[index % users.length];
    const primaryProduct = products[index % products.length];
    const secondaryProduct = products[(index + 2) % products.length];
    const itemCount = index % 3 === 0 ? 1 : 2;
    const items = [
      {
        sku: `ORD-${index + 1}-A`,
        productId: primaryProduct._id,
        name: primaryProduct.name,
        quantity: itemCount,
        price: primaryProduct.price,
      },
    ];

    if (itemCount > 1) {
      items.push({
        sku: `ORD-${index + 1}-B`,
        productId: secondaryProduct._id,
        name: secondaryProduct.name,
        quantity: 1,
        price: secondaryProduct.price,
      });
    }

    return {
      _id: makeOid(`orders-${index + 1}`),
      userId: {
        $ref: 'users',
        $id: user._id,
        $db: ACTIVE_DATABASE,
      },
      amount: items.reduce((total, item) => total + item.price * item.quantity, 0),
      status: orderStatuses[index % orderStatuses.length],
      items,
    };
  });

  return {
    version: SNAPSHOT_VERSION,
    activeDatabase: ACTIVE_DATABASE,
    databases: {
      [ACTIVE_DATABASE]: {
        name: ACTIVE_DATABASE,
        label: 'Mongolive Dev',
        description: 'Seed database used by the local explorer mock API',
        collections: {
          users: {
            name: 'users',
            label: 'Users',
            description: 'Registered demo users for the explorer',
            documents: users,
            updatedAt: now - 3_600_000,
          },
          orders: {
            name: 'orders',
            label: 'Orders',
            description: 'Purchase records linked to users by DBRef',
            documents: orders,
            updatedAt: now - 2_400_000,
          },
          products: {
            name: 'products',
            label: 'Products',
            description: 'Product catalog with pricing and inventory',
            documents: products,
            updatedAt: now - 1_800_000,
          },
        },
        updatedAt: now - 1_200_000,
      },
    },
    updatedAt: now,
  };
};
