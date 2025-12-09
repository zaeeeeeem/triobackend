import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { Upload } from '@aws-sdk/lib-storage';
import {
  InventoryStatus,
  PrismaClient,
  ProductAvailability,
  ProductStatus,
  Section,
  UserRole,
} from '@prisma/client';
import { env } from '../src/config/env';
import { s3Client, getPublicUrl } from '../src/config/s3';

const prisma = new PrismaClient();

const IMAGE_BASE_PREFIX = `${env.AWS_S3_BASE_PREFIX.replace(/\/$/, '')}/products`;
const SECTION_FOLDER_MAP: Record<Section, string> = {
  [Section.CAFE]: 'cafe',
  [Section.FLOWERS]: 'flowers',
  [Section.BOOKS]: 'books',
};
const LOCAL_IMAGE_PATH = path.resolve(__dirname, '../Assets/dummy-product.jpg');

interface VariantBuffers {
  original: Buffer;
  medium: Buffer;
  thumbnail: Buffer;
}

interface ImageUrls {
  originalUrl: string;
  mediumUrl: string;
  thumbnailUrl: string;
}

let cachedVariantBuffers: VariantBuffers | null = null;

const ensureLocalImage = async (): Promise<void> => {
  try {
    await fs.access(LOCAL_IMAGE_PATH);
  } catch {
    throw new Error(
      `Local placeholder image not found at ${LOCAL_IMAGE_PATH}. Place a JPG/PNG there before running this script.`
    );
  }
};

const loadVariantBuffers = async (): Promise<VariantBuffers> => {
  if (cachedVariantBuffers) {
    return cachedVariantBuffers;
  }

  await ensureLocalImage();
  const fileBuffer = await fs.readFile(LOCAL_IMAGE_PATH);

  cachedVariantBuffers = {
    original: await sharp(fileBuffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer(),
    medium: await sharp(fileBuffer)
      .resize(600, 600, { fit: 'cover' })
      .webp({ quality: 85 })
      .toBuffer(),
    thumbnail: await sharp(fileBuffer)
      .resize(200, 200, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer(),
  };

  console.log(`📸 Loaded placeholder image from ${LOCAL_IMAGE_PATH}`);
  return cachedVariantBuffers;
};

const uploadBufferToS3 = async (buffer: Buffer, key: string): Promise<void> => {
  const uploader = new Upload({
    client: s3Client,
    params: {
      Bucket: env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'image/webp',
    },
  });

  await uploader.done();
};

const uploadImagesForSku = async (sku: string, section: Section): Promise<ImageUrls> => {
  const buffers = await loadVariantBuffers();
  const normalizedSku = sku.toLowerCase();
  const sectionFolder = SECTION_FOLDER_MAP[section];
  const baseKey = `${IMAGE_BASE_PREFIX}/${sectionFolder}/${normalizedSku}`;
  const originalKey = `${baseKey}-original.webp`;
  const mediumKey = `${baseKey}-medium.webp`;
  const thumbnailKey = `${baseKey}-thumbnail.webp`;

  await Promise.all([
    uploadBufferToS3(buffers.original, originalKey),
    uploadBufferToS3(buffers.medium, mediumKey),
    uploadBufferToS3(buffers.thumbnail, thumbnailKey),
  ]);

  return {
    originalUrl: getPublicUrl(originalKey),
    mediumUrl: getPublicUrl(mediumKey),
    thumbnailUrl: getPublicUrl(thumbnailKey),
  };
};

interface BaseSeed {
  sku: string;
  price: number;
  compareAtPrice: number;
  costPrice: number;
  stockQuantity: number;
  tags: string[];
  collections: string[];
  supplier: string;
}

interface CafeSeed extends BaseSeed {
  cafe: {
    name: string;
    description: string;
    category: string;
    origin?: string;
    roastLevel?: string;
    caffeineContent?: string;
    size?: string;
    temperature?: string;
    allergens?: string[];
    calories?: number;
  };
}

interface FlowerSeed extends BaseSeed {
  flowers: {
    name: string;
    description: string;
    arrangementType: string;
    occasion?: string;
    colors?: string[];
    flowerTypes?: string[];
    size?: string;
    seasonality?: string;
    careInstructions?: string;
    vaseIncluded?: boolean;
  };
}

interface BookSeed extends BaseSeed {
  books: {
    title: string;
    description: string;
    author: string;
    isbn?: string;
    publisher?: string;
    publishDate?: Date;
    language?: string;
    pageCount?: number;
    format: string;
    genre: string[];
    condition?: string;
    edition?: string;
    dimensions?: string;
  weight?: number;
};
}

const padNumber = (value: number) => value.toString().padStart(3, '0');

const cafeTemplates = [
  {
    baseName: 'Velvet Maple Latte',
    description: 'Silky micro-foam latte infused with maple-sweetened espresso.',
    category: 'Coffee',
    origin: 'Colombia',
    roastLevel: 'Medium',
    caffeineContent: 'High',
    size: '12 oz',
    temperature: 'Hot',
    allergens: ['Dairy'],
    calories: 210,
    price: 520,
    tags: ['latte', 'signature'],
    collections: ['Cafe Core'],
  },
  {
    baseName: 'Cardamom Cold Brew',
    description: '18-hour steeped cold brew with cardamom syrup finish.',
    category: 'Cold Brew',
    origin: 'Ethiopia',
    roastLevel: 'Light',
    caffeineContent: 'High',
    size: '16 oz',
    temperature: 'Cold',
    allergens: [],
    calories: 120,
    price: 560,
    tags: ['cold brew', 'spiced'],
    collections: ['Summer Lab'],
  },
  {
    baseName: 'Smoked Sea Salt Mocha',
    description: 'Dark chocolate mocha topped with smoked sea salt whip.',
    category: 'Coffee',
    origin: 'Peru',
    roastLevel: 'Medium',
    caffeineContent: 'Medium',
    size: '12 oz',
    temperature: 'Hot',
    allergens: ['Dairy'],
    calories: 260,
    price: 540,
    tags: ['mocha', 'dessert'],
    collections: ['Winter Cabin'],
  },
  {
    baseName: 'Hazelnut Cortado',
    description: 'Equal parts espresso and milk with roasted hazelnut syrup.',
    category: 'Coffee',
    origin: 'Guatemala',
    roastLevel: 'Medium',
    caffeineContent: 'Medium',
    size: '6 oz',
    temperature: 'Hot',
    allergens: ['Tree Nuts', 'Dairy'],
    calories: 160,
    price: 480,
    tags: ['cortado', 'nuts'],
    collections: ['Alt Milk'],
  },
  {
    baseName: 'Rose Pistachio Cappuccino',
    description: 'Classic cappuccino dusted with rose sugar and pistachio crumble.',
    category: 'Coffee',
    origin: 'House Blend',
    roastLevel: 'Medium',
    caffeineContent: 'High',
    size: '10 oz',
    temperature: 'Hot',
    allergens: ['Tree Nuts', 'Dairy'],
    calories: 190,
    price: 510,
    tags: ['cappuccino', 'floral'],
    collections: ['Heritage Blend'],
  },
  {
    baseName: 'Coconut Cascara Fizz',
    description: 'Sparkling cascara tea poured over coconut cold foam.',
    category: 'Sparkling',
    origin: 'Costa Rica',
    roastLevel: 'Light',
    caffeineContent: 'Medium',
    size: '14 oz',
    temperature: 'Cold',
    allergens: [],
    calories: 130,
    price: 550,
    tags: ['sparkling', 'tea'],
    collections: ['Iced Lab'],
  },
];

const flowerTemplates = [
  {
    baseName: 'Rosewood Muse',
    description: 'Garden rose bouquet with eucalyptus and wax flower.',
    arrangementType: 'Bouquet',
    occasion: 'Anniversary',
    colors: ['Red', 'Blush'],
    flowerTypes: ['Garden Rose', 'Wax Flower'],
    size: 'Premium',
    seasonality: 'Year-round',
    careInstructions: 'Refresh cool water daily and trim stems.',
    vaseIncluded: false,
    price: 3200,
    tags: ['roses', 'romance'],
    collections: ['Romance'],
    supplier: 'TRIO Floral Collective',
  },
  {
    baseName: 'Meadow Song',
    description: 'Loose hand-tie with ranunculus, snapdragon, and meadow greens.',
    arrangementType: 'Hand-tied',
    occasion: 'Birthday',
    colors: ['Peach', 'Cream'],
    flowerTypes: ['Ranunculus', 'Snapdragon'],
    size: 'Large',
    seasonality: 'Spring',
    careInstructions: 'Keep bouquet away from direct sun.',
    vaseIncluded: false,
    price: 2850,
    tags: ['wildflower', 'hand-tie'],
    collections: ['Everyday Cheer'],
    supplier: 'Bloom Lane Market',
  },
  {
    baseName: 'Aurora Vase',
    description: 'Curated vase with dahlias and preserved grasses.',
    arrangementType: 'Vase',
    occasion: 'Housewarming',
    colors: ['Coral', 'Gold'],
    flowerTypes: ['Dahlia', 'Garden Rose'],
    size: 'Premium',
    seasonality: 'Summer',
    careInstructions: 'Display in indirect light and mist daily.',
    vaseIncluded: true,
    price: 3400,
    tags: ['designer', 'vase'],
    collections: ['Designer Series'],
    supplier: 'TRIO Floral Collective',
  },
  {
    baseName: 'Winter Frost',
    description: 'White amaryllis, hellebore, and cedar tips with silver brunia.',
    arrangementType: 'Bouquet',
    occasion: 'Holiday',
    colors: ['White', 'Silver'],
    flowerTypes: ['Amaryllis', 'Hellebore'],
    size: 'Large',
    seasonality: 'Winter',
    careInstructions: 'Keep water cool and remove spent blooms.',
    vaseIncluded: false,
    price: 2700,
    tags: ['winter', 'bouquet'],
    collections: ['Seasonal'],
    supplier: 'Northwind Farms',
  },
  {
    baseName: 'Golden Jubilee',
    description: 'Sunflower basket with citrus slices and mums.',
    arrangementType: 'Basket',
    occasion: 'Celebration',
    colors: ['Yellow', 'Orange'],
    flowerTypes: ['Sunflower', 'Mum'],
    size: 'Premium',
    seasonality: 'Autumn',
    careInstructions: 'Mist flowers and keep foam damp.',
    vaseIncluded: false,
    price: 3100,
    tags: ['basket', 'sunflower'],
    collections: ['Celebrations'],
    supplier: 'Meadowlight Floral',
  },
];

const bookTemplates = [
  {
    baseTitle: 'Silk Roads Reimagined',
    description: 'Illustrated history of the trade routes spanning Central Asia.',
    author: 'Mina Rashid',
    publisher: 'Atlas Press',
    language: 'English',
    pageCount: 384,
    format: 'Hardcover',
    genre: ['History', 'Travel'],
    condition: 'New',
    edition: 'First',
    dimensions: '6.5 x 9.2 in',
    weight: 780,
    price: 1850,
    tags: ['history', 'travel'],
    collections: ['Bestsellers'],
    supplier: 'City Books Distributor',
  },
  {
    baseTitle: 'Karachi By Dawn',
    description: 'Morning essays capturing rituals across the city.',
    author: 'Zara Hussain',
    publisher: 'Port City Books',
    language: 'English',
    pageCount: 296,
    format: 'Paperback',
    genre: ['Memoir', 'Urban Studies'],
    condition: 'New',
    edition: 'First',
    dimensions: '5.5 x 8.5 in',
    weight: 440,
    price: 1650,
    tags: ['memoir', 'city'],
    collections: ['Local Voices'],
    supplier: 'Harbor Publishing',
  },
  {
    baseTitle: 'Desert Archivist',
    description: 'Adaptive architecture case studies from arid regions.',
    author: 'Omer Khan',
    publisher: 'Framework Studio',
    language: 'English',
    pageCount: 412,
    format: 'Hardcover',
    genre: ['Architecture', 'Design'],
    condition: 'New',
    edition: 'Deluxe',
    dimensions: '8.0 x 10.5 in',
    weight: 1020,
    price: 2100,
    tags: ['architecture', 'design'],
    collections: ['Design Shelf'],
    supplier: 'City Books Distributor',
  },
  {
    baseTitle: 'Mathematics of Tea',
    description: 'Extraction curves, ratios, and rituals of tea brewing.',
    author: 'Dr. Leah Powell',
    publisher: 'Infusion Press',
    language: 'English',
    pageCount: 256,
    format: 'Hardcover',
    genre: ['Science', 'Food'],
    condition: 'New',
    edition: 'Second',
    dimensions: '6.2 x 8.8 in',
    weight: 640,
    price: 1750,
    tags: ['science', 'culinary'],
    collections: ['Culinary Lab'],
    supplier: 'Gastronome Distribution',
  },
  {
    baseTitle: 'Analog Hearts Digital Minds',
    description: 'Essay collection on humane technology rituals.',
    author: 'Hina Ghazi',
    publisher: 'Signal North',
    language: 'English',
    pageCount: 350,
    format: 'Hardcover',
    genre: ['Technology', 'Essay'],
    condition: 'New',
    edition: 'First',
    dimensions: '6.4 x 9.6 in',
    weight: 760,
    price: 2000,
    tags: ['technology', 'essays'],
    collections: ['Thought Leaders'],
    supplier: 'Signal North Logistics',
  },
];

const generateCafeSeeds = (count: number): CafeSeed[] =>
  Array.from({ length: count }).map((_, index) => {
    const template = cafeTemplates[index % cafeTemplates.length];
    const sku = `CAF-${padNumber(index + 1)}`;
    const priceVariation = (index % 3) * 15;
    const stock = 60 + ((index * 7) % 30);
    return {
      sku,
      price: template.price + priceVariation,
      compareAtPrice: template.price + priceVariation + 40,
      costPrice: Math.round((template.price + priceVariation) * 0.55),
      stockQuantity: stock,
      tags: template.tags,
      collections: template.collections,
      supplier: 'TRIO Cafe Roastery',
      cafe: {
        name: `${template.baseName} ${index + 1}`,
        description: template.description,
        category: template.category,
        origin: template.origin,
        roastLevel: template.roastLevel,
        caffeineContent: template.caffeineContent,
        size: template.size,
        temperature: template.temperature,
        allergens: template.allergens,
        calories: template.calories,
      },
    };
  });

const generateFlowerSeeds = (count: number): FlowerSeed[] =>
  Array.from({ length: count }).map((_, index) => {
    const template = flowerTemplates[index % flowerTemplates.length];
    const sku = `FLO-${padNumber(index + 1)}`;
    const priceVariation = (index % 4) * 75;
    const stock = 18 + ((index * 5) % 18);
    return {
      sku,
      price: template.price + priceVariation,
      compareAtPrice: template.price + priceVariation + 300,
      costPrice: Math.round((template.price + priceVariation) * 0.52),
      stockQuantity: stock,
      tags: template.tags,
      collections: template.collections,
      supplier: template.supplier,
      flowers: {
        name: `${template.baseName} ${index + 1}`,
        description: template.description,
        arrangementType: template.arrangementType,
        occasion: template.occasion,
        colors: template.colors,
        flowerTypes: template.flowerTypes,
        size: template.size,
        seasonality: template.seasonality,
        careInstructions: template.careInstructions,
        vaseIncluded: template.vaseIncluded,
      },
    };
  });

const generateBookSeeds = (count: number): BookSeed[] =>
  Array.from({ length: count }).map((_, index) => {
    const template = bookTemplates[index % bookTemplates.length];
    const sku = `BOO-${padNumber(index + 1)}`;
    const priceVariation = (index % 3) * 60;
    const stock = 30 + ((index * 9) % 40);
    return {
      sku,
      price: template.price + priceVariation,
      compareAtPrice: template.price + priceVariation + 250,
      costPrice: Math.round((template.price + priceVariation) * 0.5),
      stockQuantity: stock,
      tags: template.tags,
      collections: template.collections,
      supplier: template.supplier,
      books: {
        title: `${template.baseTitle} Vol. ${index + 1}`,
        description: template.description,
        author: template.author,
        isbn: `978-1-${(20240 + index).toString().padStart(5, '0')}`,
        publisher: template.publisher,
        publishDate: new Date(2015 + (index % 10), (index * 3) % 12, 15),
        language: template.language,
        pageCount: template.pageCount,
        format: template.format,
        genre: template.genre,
        condition: template.condition,
        edition: template.edition,
        dimensions: template.dimensions,
        weight: template.weight,
      },
    };
  });

const cafeSeeds = generateCafeSeeds(20);
const flowerSeeds = generateFlowerSeeds(20);
const bookSeeds = generateBookSeeds(20);
const seedSkus = [...cafeSeeds, ...flowerSeeds, ...bookSeeds].map((seed) => seed.sku);

const createInventoryItem = async ({
  productId,
  name,
  seed,
  section,
}: {
  productId: string;
  name: string;
  seed: BaseSeed;
  section: Section;
}) => {
  await prisma.inventoryItem.create({
    data: {
      productId,
      productName: name,
      sku: seed.sku,
      section,
      variant: null,
      onHand: seed.stockQuantity,
      committed: 0,
      available: seed.stockQuantity,
      incoming: 0,
      location: 'Main Warehouse',
      supplier: seed.supplier,
      costPrice: seed.costPrice,
      sellingPrice: seed.price,
      status: InventoryStatus.IN_STOCK,
      reorderPoint: 10,
      reorderQuantity: 40,
      unit: 'units',
      barcode: `${seed.sku}-BC`,
    },
  });
};

const createCafeProduct = async (seed: CafeSeed, adminId: string) => {
  const existing = await prisma.product.findUnique({ where: { sku: seed.sku } });
  if (existing) {
    console.log(`⚠️  Skipping ${seed.sku} (already exists)`);
    return false;
  }

  const imageUrls = await uploadImagesForSku(seed.sku, Section.CAFE);

  const product = await prisma.product.create({
    data: {
      sku: seed.sku,
      section: Section.CAFE,
      price: seed.price,
      compareAtPrice: seed.compareAtPrice,
      costPrice: seed.costPrice,
      stockQuantity: seed.stockQuantity,
      trackQuantity: true,
      continueSellingOutOfStock: false,
      availability: ProductAvailability.AVAILABLE,
      status: ProductStatus.ACTIVE,
      tags: seed.tags,
      collections: seed.collections,
      createdBy: adminId,
      updatedBy: adminId,
      cafeProduct: {
        create: seed.cafe,
      },
      images: {
        create: [
          {
            ...imageUrls,
            altText: seed.cafe.name,
            position: 0,
          },
        ],
      },
    },
  });

  await createInventoryItem({ productId: product.id, name: seed.cafe.name, seed, section: Section.CAFE });
  return true;
};

const createFlowersProduct = async (seed: FlowerSeed, adminId: string) => {
  const existing = await prisma.product.findUnique({ where: { sku: seed.sku } });
  if (existing) {
    console.log(`⚠️  Skipping ${seed.sku} (already exists)`);
    return false;
  }

  const imageUrls = await uploadImagesForSku(seed.sku, Section.FLOWERS);

  const product = await prisma.product.create({
    data: {
      sku: seed.sku,
      section: Section.FLOWERS,
      price: seed.price,
      compareAtPrice: seed.compareAtPrice,
      costPrice: seed.costPrice,
      stockQuantity: seed.stockQuantity,
      trackQuantity: true,
      continueSellingOutOfStock: false,
      availability: ProductAvailability.AVAILABLE,
      status: ProductStatus.ACTIVE,
      tags: seed.tags,
      collections: seed.collections,
      createdBy: adminId,
      updatedBy: adminId,
      flowersProduct: {
        create: seed.flowers,
      },
      images: {
        create: [
          {
            ...imageUrls,
            altText: seed.flowers.name,
            position: 0,
          },
        ],
      },
    },
  });

  await createInventoryItem({
    productId: product.id,
    name: seed.flowers.name,
    seed,
    section: Section.FLOWERS,
  });
  return true;
};

const createBooksProduct = async (seed: BookSeed, adminId: string) => {
  const existing = await prisma.product.findUnique({ where: { sku: seed.sku } });
  if (existing) {
    console.log(`⚠️  Skipping ${seed.sku} (already exists)`);
    return false;
  }

  const imageUrls = await uploadImagesForSku(seed.sku, Section.BOOKS);

  const product = await prisma.product.create({
    data: {
      sku: seed.sku,
      section: Section.BOOKS,
      price: seed.price,
      compareAtPrice: seed.compareAtPrice,
      costPrice: seed.costPrice,
      stockQuantity: seed.stockQuantity,
      trackQuantity: true,
      continueSellingOutOfStock: false,
      availability: ProductAvailability.AVAILABLE,
      status: ProductStatus.ACTIVE,
      tags: seed.tags,
      collections: seed.collections,
      createdBy: adminId,
      updatedBy: adminId,
      booksProduct: {
        create: seed.books,
      },
      images: {
        create: [
          {
            ...imageUrls,
            altText: seed.books.title,
            position: 0,
          },
        ],
      },
    },
  });

  await createInventoryItem({
    productId: product.id,
    name: seed.books.title,
    seed,
    section: Section.BOOKS,
  });
  return true;
};

type SectionCreator<T> = (seed: T, adminId: string) => Promise<boolean>;

const seedSection = async <T extends BaseSeed>(
  seeds: T[],
  sectionCreator: SectionCreator<T>,
  adminId: string
): Promise<number> => {
  let created = 0;
  for (const seed of seeds) {
    const wasCreated = await sectionCreator(seed, adminId);
    if (wasCreated) {
      created += 1;
      console.log(`✓ Created ${seed.sku}`);
    }
  }
  return created;
};

const deleteExistingSeedProducts = async (): Promise<void> => {
  if (seedSkus.length === 0) {
    return;
  }

  const result = await prisma.product.deleteMany({
    where: { sku: { in: seedSkus } },
  });

  if (result.count > 0) {
    console.log(`🗑️  Deleted ${result.count} previously seeded products`);
  }
};

const main = async () => {
  const admin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
    select: { id: true },
  });

  if (!admin) {
    throw new Error('No admin user found. Please create at least one ADMIN before seeding products.');
  }

  await loadVariantBuffers();
  await deleteExistingSeedProducts();

  console.log('🚀 Starting dummy product seeding');
  const cafeCount = await seedSection(cafeSeeds, createCafeProduct, admin.id);
  const flowerCount = await seedSection(flowerSeeds, createFlowersProduct, admin.id);
  const bookCount = await seedSection(bookSeeds, createBooksProduct, admin.id);

  console.log(`🎉 Finished seeding ${cafeCount + flowerCount + bookCount} products.`);
};

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
