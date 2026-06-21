// path: src/data/sampleData.ts
import type { BsonObjectId, JsonObject, JsonValue, MockSnapshot } from '../types/explorer';

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

// 임의 깊이로 중첩되는 대댓글 트리 — NoSQL의 schema-less nested document를 보여주기 위한 시드 타입
interface ReplySeed {
  id: string;
  authorIndex: number;
  body: string;
  replies?: ReplySeed[];
}

interface ReviewSeed {
  id: string;
  productIndex: number;
  authorIndex: number;
  rating: number;
  title: string;
  body: string;
  replies?: ReplySeed[];
}

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

  interface ProductSeed {
    name: string;
    price: number;
    stock: number;
    tags: string[];
    specs: Record<string, JsonValue>;
  }

  const productSeeds: ProductSeed[] = [
    {
      name: 'Cloud Mug',
      price: 18,
      stock: 120,
      tags: ['home', 'desk', 'allegedly-microwave-safe'],
      specs: { capacityMl: 350, material: 'ceramic', microwaveSafe: true },
    },
    {
      name: 'Orbit Lamp',
      price: 72,
      stock: 45,
      tags: ['lighting', 'office', 'physics-defying'],
      specs: { brightnessLumens: 600, colorTemps: ['warm', 'neutral', 'cool'], powerSource: 'USB-C' },
    },
    {
      name: 'Focus Pad',
      price: 24,
      stock: 90,
      tags: ['stationery', 'productivity', 'audited'],
      specs: { sheetCount: 80, paperWeightGsm: 120, ruled: false },
    },
    {
      name: 'Halo Keyboard',
      price: 128,
      stock: 28,
      tags: ['hardware', 'premium', 'cult-following'],
      specs: {
        switches: 'hot-swappable',
        layout: '75%',
        connectivity: ['bluetooth', 'usb-c'],
        backlight: { type: 'RGB', maxColors: 16800000 },
      },
    },
    {
      name: 'Pulse Bottle',
      price: 29,
      stock: 150,
      tags: ['travel', 'fitness', 'suspiciously-good'],
      specs: { capacityMl: 750, material: 'stainless-steel', insulated: true, lidType: 'flip' },
    },
    {
      name: 'Frame Stand',
      price: 34,
      stock: 64,
      tags: ['accessory', 'home', 'gravity-optional'],
      specs: { maxDeviceSizeIn: 13, adjustable: true, foldable: true },
    },
  ];

  const products = productSeeds.map((seed, index) => ({
    _id: makeOid(`products-${index + 1}`),
    name: seed.name,
    price: seed.price,
    stock: seed.stock,
    tags: [...seed.tags],
    // 제품마다 카테고리별로 형태가 다른 specs — 같은 컬렉션 안의 schema-less 문서를 보여줌
    specs: structuredClone(seed.specs),
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

  // 대댓글이 임의 깊이로 중첩되는 리뷰 트리 — RDBMS라면 self-join이 필요한 구조를 단일 문서로 표현
  const buildReplies = (seeds: ReplySeed[] | undefined, depth: number): JsonObject[] => {
    if (!seeds || seeds.length === 0) return [];
    return seeds.map((seed, index) => {
      const author = users[seed.authorIndex % users.length];
      const nested = buildReplies(seed.replies, depth + 1);
      return {
        _id: makeOid(`reply-${seed.id}`),
        authorId: {
          $ref: 'users',
          $id: author._id,
          $db: ACTIVE_DATABASE,
        },
        body: seed.body,
        createdAt: formatDate(now - depth * 1_800_000 - index * 600_000),
        ...(nested.length > 0 ? { replies: nested } : {}),
      };
    });
  };

  const reviewSeeds: ReviewSeed[] = [
    {
      id: 'r1',
      productIndex: 3,
      authorIndex: 1,
      rating: 5,
      title: 'Worst keyboard I have owned',
      body: 'Hot-swappable switches, 75% layout, bluetooth that never drops. 0/10 would buy again because now I physically cannot type on anything else without crying.',
      replies: [
        {
          id: 'r1-1',
          authorIndex: 5,
          body: 'Real ones know 75% > full-size. Fight me in the comments.',
          replies: [
            {
              id: 'r1-1-1',
              authorIndex: 1,
              body: 'Survived 3 ragequits and a coffee spill without dropping connection. We are not the same.',
            },
          ],
        },
        {
          id: 'r1-2',
          authorIndex: 3,
          body: 'battery life on bluetooth tho? asking for a friend who is also me',
          replies: [
            {
              id: 'r1-2-1',
              authorIndex: 5,
              body: '3 weeks. I forgot it even has a charging cable.',
              replies: [
                {
                  id: 'r1-2-1-1',
                  authorIndex: 9,
                  body: 'found the marketing department',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'r2',
      productIndex: 1,
      authorIndex: 4,
      rating: 2,
      title: '600 lumens but my room got darker somehow',
      body: 'Scientifically this should not be possible. Reporting to NASA and also my landlord.',
      replies: [
        {
          id: 'r2-1',
          authorIndex: 6,
          body: 'skill issue, point it AT the desk not at the wall like a caveman',
          replies: [
            {
              id: 'r2-1-1',
              authorIndex: 4,
              body: '...oh',
            },
          ],
        },
      ],
    },
    {
      id: 'r3',
      productIndex: 2,
      authorIndex: 7,
      rating: 1,
      title: 'Counted the sheets. It is 78. Not 80. I have been lied to.',
      body: 'Box says 80 sheets. Counted three times. 78. My trust in mankind is now also short by two sheets.',
      replies: [
        {
          id: 'r3-1',
          authorIndex: 9,
          body: 'this you sir? touch grass',
          replies: [
            {
              id: 'r3-1-1',
              authorIndex: 7,
              body: 'no the math checks out, class action when',
            },
          ],
        },
      ],
    },
    {
      id: 'r4',
      productIndex: 4,
      authorIndex: 8,
      rating: 5,
      title: 'Actually good, no jokes here',
      body: 'Insulation works exactly as advertised even on a 6 hour hike. Nothing funny to say, it just works.',
      replies: [
        {
          id: 'r4-1',
          authorIndex: 0,
          body: 'found the bot account',
          replies: [
            {
              id: 'r4-1-1',
              authorIndex: 8,
              body: 'I am a real person and I stand by my hydration',
            },
          ],
        },
        {
          id: 'r4-2',
          authorIndex: 9,
          body: 'sir this is a Wendy’s, post something unhinged or leave',
        },
      ],
    },
    {
      id: 'r5',
      productIndex: 0,
      authorIndex: 2,
      rating: 1,
      title: 'Cute but chips easily',
      body: 'Box says "microwave safe." Box was lying. RIP mug, RIP my coffee, RIP my Tuesday.',
      replies: [
        {
          id: 'r5-1',
          authorIndex: 9,
          body: 'it says microwave SAFE not microwave PROOF, use context clues',
          replies: [
            {
              id: 'r5-1-1',
              authorIndex: 2,
              body: 'found the guy who writes the warning labels',
              replies: [
                {
                  id: 'r5-1-1-1',
                  authorIndex: 7,
                  body: 'this comment section has more drama than my family group chat ㅋㅋㅋ',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'r6',
      productIndex: 5,
      authorIndex: 3,
      rating: 3,
      title: 'Adjustable until it adjusts itself onto the floor at 2am',
      body: 'Foldable, lightweight, betrayed me in my sleep. 3 stars because my phone screen survived somehow.',
      replies: [
        {
          id: 'r6-1',
          authorIndex: 5,
          body: 'skill issue, mine has survived two earthquakes',
        },
        {
          id: 'r6-2',
          authorIndex: 1,
          body: 'the fact your PHONE survived is the real plot twist here',
        },
      ],
    },
  ];

  const reviews = reviewSeeds.map((seed, index) => {
    const product = products[seed.productIndex];
    const author = users[seed.authorIndex % users.length];
    const replies = buildReplies(seed.replies, 1);
    return {
      _id: makeOid(`reviews-${seed.id}`),
      productId: {
        $ref: 'products',
        $id: product._id,
        $db: ACTIVE_DATABASE,
      },
      authorId: {
        $ref: 'users',
        $id: author._id,
        $db: ACTIVE_DATABASE,
      },
      rating: seed.rating,
      title: seed.title,
      body: seed.body,
      createdAt: formatDate(now - index * 43_200_000),
      ...(replies.length > 0 ? { replies } : {}),
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
          reviews: {
            name: 'reviews',
            label: 'Reviews',
            description: 'Threaded product reviews with arbitrarily nested replies',
            documents: reviews,
            updatedAt: now - 900_000,
            titleKey: 'title',
          },
        },
        updatedAt: now - 1_200_000,
      },
    },
    updatedAt: now,
  };
};
