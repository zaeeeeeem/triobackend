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
const SECTION_FOLDER = 'cafe';
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

const uploadImagesForSku = async (sku: string): Promise<ImageUrls> => {
  const buffers = await loadVariantBuffers();
  const normalizedSku = sku.toLowerCase();
  const baseKey = `${IMAGE_BASE_PREFIX}/${SECTION_FOLDER}/${normalizedSku}`;
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

interface CafeSeed {
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  compareAtPrice: number;
  costPrice: number;
  stockQuantity: number;
  tags: string[];
  collections: string[];
  supplier: string;
  origin?: string;
  roastLevel?: string;
  caffeineContent?: string;
  size?: string;
  temperature?: string;
  allergens?: string[];
  calories?: number;
}

const padNumber = (value: number) => value.toString().padStart(3, '0');

// Product templates for each tag category
const CATEGORY_TEMPLATES = {
  'Thin Crust Pizza': [
    { name: 'Margherita Pizza', description: 'Classic tomato sauce, fresh mozzarella, and basil on thin crispy crust', category: 'Pizza', price: 1200, calories: 850, origin: 'Italy', temperature: 'Hot', allergens: ['Dairy', 'Gluten'] },
    { name: 'Pepperoni Pizza', description: 'Spicy pepperoni with melted mozzarella on thin crust', category: 'Pizza', price: 1400, calories: 920, origin: 'Italy', temperature: 'Hot', allergens: ['Dairy', 'Gluten'] },
    { name: 'Veggie Supreme Pizza', description: 'Bell peppers, mushrooms, olives, and onions on thin crust', category: 'Pizza', price: 1350, calories: 780, origin: 'Italy', temperature: 'Hot', allergens: ['Dairy', 'Gluten'] },
    { name: 'BBQ Chicken Pizza', description: 'Grilled chicken with BBQ sauce and red onions', category: 'Pizza', price: 1500, calories: 950, origin: 'Italy', temperature: 'Hot', allergens: ['Dairy', 'Gluten'] },
    { name: 'Four Cheese Pizza', description: 'Blend of mozzarella, cheddar, parmesan, and blue cheese', category: 'Pizza', price: 1600, calories: 1050, origin: 'Italy', temperature: 'Hot', allergens: ['Dairy', 'Gluten'] },
  ],
  'Turn up the heat': [
    { name: 'Spicy Jalapeño Burger', description: 'Beef patty with jalapeños, pepper jack cheese, and chipotle mayo', category: 'Burgers', price: 950, calories: 820, temperature: 'Hot', allergens: ['Dairy', 'Gluten'] },
    { name: 'Ghost Pepper Wings', description: 'Crispy chicken wings tossed in ghost pepper sauce', category: 'Wings', price: 850, calories: 680, temperature: 'Hot', allergens: ['Gluten'] },
    { name: 'Sriracha Shrimp Tacos', description: 'Grilled shrimp with sriracha mayo and cabbage slaw', category: 'Tacos', price: 900, calories: 520, temperature: 'Hot', allergens: ['Shellfish', 'Gluten'] },
    { name: 'Carolina Reaper Fries', description: 'Crispy fries dusted with Carolina Reaper seasoning', category: 'Sides', price: 450, calories: 420, temperature: 'Hot', allergens: ['Gluten'] },
    { name: 'Fire-Roasted Quesadilla', description: 'Cheese quesadilla with fire-roasted peppers and habanero', category: 'Mexican', price: 750, calories: 650, temperature: 'Hot', allergens: ['Dairy', 'Gluten'] },
  ],
  'Starters': [
    { name: 'Loaded Nachos', description: 'Crispy tortilla chips with cheese, jalapeños, and sour cream', category: 'Appetizers', price: 650, calories: 720, temperature: 'Hot', allergens: ['Dairy', 'Gluten'] },
    { name: 'Mozzarella Sticks', description: 'Golden fried mozzarella with marinara dipping sauce', category: 'Appetizers', price: 550, calories: 480, temperature: 'Hot', allergens: ['Dairy', 'Gluten'] },
    { name: 'Chicken Wings Platter', description: 'Choice of buffalo, BBQ, or honey garlic sauce', category: 'Appetizers', price: 800, calories: 650, temperature: 'Hot', allergens: ['Gluten'] },
    { name: 'Crispy Calamari', description: 'Lightly breaded calamari rings with lemon aioli', category: 'Appetizers', price: 850, calories: 520, temperature: 'Hot', allergens: ['Shellfish', 'Gluten'] },
    { name: 'Spinach Artichoke Dip', description: 'Creamy spinach and artichoke dip with tortilla chips', category: 'Appetizers', price: 600, calories: 580, temperature: 'Hot', allergens: ['Dairy'] },
  ],
  'Sliders': [
    { name: 'Classic Beef Sliders', description: 'Three mini beef burgers with cheese and pickles', category: 'Sliders', price: 700, calories: 620, temperature: 'Hot', allergens: ['Dairy', 'Gluten'] },
    { name: 'BBQ Pulled Pork Sliders', description: 'Slow-cooked pulled pork with coleslaw', category: 'Sliders', price: 750, calories: 680, temperature: 'Hot', allergens: ['Gluten'] },
    { name: 'Chicken Tikka Sliders', description: 'Grilled chicken tikka with mint chutney', category: 'Sliders', price: 720, calories: 580, temperature: 'Hot', allergens: ['Dairy', 'Gluten'] },
    { name: 'Veggie Bean Sliders', description: 'Black bean patties with avocado and salsa', category: 'Sliders', price: 650, calories: 480, temperature: 'Hot', allergens: ['Gluten'] },
    { name: 'Fish Fillet Sliders', description: 'Crispy fish with tartar sauce and lettuce', category: 'Sliders', price: 780, calories: 550, temperature: 'Hot', allergens: ['Fish', 'Gluten'] },
  ],
  'Somewhat Sooper': [
    { name: 'Truffle Mac & Cheese', description: 'Creamy mac and cheese with truffle oil', category: 'Pasta', price: 950, calories: 820, temperature: 'Hot', allergens: ['Dairy', 'Gluten'] },
    { name: 'Wagyu Beef Burger', description: 'Premium wagyu beef patty with artisan toppings', category: 'Burgers', price: 1800, calories: 920, temperature: 'Hot', allergens: ['Dairy', 'Gluten'] },
    { name: 'Lobster Roll', description: 'Fresh lobster meat on a toasted brioche roll', category: 'Seafood', price: 2200, calories: 650, temperature: 'Hot', allergens: ['Shellfish', 'Gluten'] },
    { name: 'Saffron Risotto', description: 'Creamy arborio rice with saffron and parmesan', category: 'Italian', price: 1200, calories: 720, temperature: 'Hot', allergens: ['Dairy'] },
    { name: 'Duck Confit Salad', description: 'Slow-cooked duck leg with mixed greens', category: 'Salad', price: 1500, calories: 580, temperature: 'Hot', allergens: [] },
  ],
  'Sandwiches': [
    { name: 'Club Sandwich', description: 'Triple-decker with turkey, bacon, lettuce, and tomato', category: 'Sandwiches', price: 750, calories: 680, temperature: 'Hot', allergens: ['Gluten'] },
    { name: 'Philly Cheesesteak', description: 'Thinly sliced steak with peppers, onions, and cheese', category: 'Sandwiches', price: 900, calories: 820, temperature: 'Hot', allergens: ['Dairy', 'Gluten'] },
    { name: 'Chicken Pesto Sandwich', description: 'Grilled chicken with basil pesto and mozzarella', category: 'Sandwiches', price: 800, calories: 620, temperature: 'Hot', allergens: ['Dairy', 'Gluten'] },
    { name: 'Tuna Melt', description: 'Tuna salad with melted cheese on sourdough', category: 'Sandwiches', price: 700, calories: 580, temperature: 'Hot', allergens: ['Fish', 'Dairy', 'Gluten'] },
    { name: 'BLT Supreme', description: 'Bacon, lettuce, tomato with avocado and mayo', category: 'Sandwiches', price: 650, calories: 520, temperature: 'Hot', allergens: ['Gluten'] },
  ],
  'Pizza Deals': [
    { name: 'Family Combo Pizza', description: 'Large pizza with 2 toppings and 1.5L drink', category: 'Pizza', price: 2200, calories: 3200, temperature: 'Hot', allergens: ['Dairy', 'Gluten'] },
    { name: 'Pizza + Wings Deal', description: 'Medium pizza with 6 chicken wings', category: 'Pizza', price: 1800, calories: 2400, temperature: 'Hot', allergens: ['Dairy', 'Gluten'] },
    { name: 'Double Pizza Special', description: 'Two medium pizzas with choice of toppings', category: 'Pizza', price: 2500, calories: 3800, temperature: 'Hot', allergens: ['Dairy', 'Gluten'] },
    { name: 'Pizza Party Pack', description: 'Two large pizzas + garlic bread + 2L drink', category: 'Pizza', price: 3200, calories: 4500, temperature: 'Hot', allergens: ['Dairy', 'Gluten'] },
    { name: 'Lunch Pizza Deal', description: 'Personal pizza with side and drink', category: 'Pizza', price: 850, calories: 1200, temperature: 'Hot', allergens: ['Dairy', 'Gluten'] },
  ],
  'Coffee': [
    { name: 'Espresso Shot', description: 'Rich and bold single shot of espresso', category: 'Coffee', price: 280, calories: 5, origin: 'Colombia', roastLevel: 'Dark', caffeineContent: 'High', size: '2 oz', temperature: 'Hot', allergens: [] },
    { name: 'Cappuccino', description: 'Espresso with steamed milk and foam', category: 'Coffee', price: 450, calories: 120, origin: 'Ethiopia', roastLevel: 'Medium', caffeineContent: 'High', size: '8 oz', temperature: 'Hot', allergens: ['Dairy'] },
    { name: 'Caffe Latte', description: 'Smooth espresso with steamed milk', category: 'Coffee', price: 480, calories: 180, origin: 'Brazil', roastLevel: 'Medium', caffeineContent: 'Medium', size: '12 oz', temperature: 'Hot', allergens: ['Dairy'] },
    { name: 'Caramel Macchiato', description: 'Vanilla-flavored latte with caramel drizzle', category: 'Coffee', price: 550, calories: 250, origin: 'Guatemala', roastLevel: 'Medium', caffeineContent: 'High', size: '12 oz', temperature: 'Hot', allergens: ['Dairy'] },
    { name: 'Mocha', description: 'Espresso with chocolate and steamed milk', category: 'Coffee', price: 520, calories: 290, origin: 'Colombia', roastLevel: 'Dark', caffeineContent: 'Medium', size: '12 oz', temperature: 'Hot', allergens: ['Dairy'] },
  ],
};

const generateCafeSeeds = (): CafeSeed[] => {
  const seeds: CafeSeed[] = [];
  let skuCounter = 1;

  // Generate 23 products for each tag
  Object.entries(CATEGORY_TEMPLATES).forEach(([tag, templates]) => {
    for (let i = 0; i < 23; i++) {
      const template = templates[i % templates.length];
      const sku = `CAF-MENU-${padNumber(skuCounter)}`;
      const priceVariation = (i % 5) * 20;
      const stock = 50 + ((i * 7) % 50);

      seeds.push({
        sku,
        name: `${template.name} ${Math.floor(i / templates.length) + 1}`,
        description: template.description,
        category: template.category,
        price: template.price + priceVariation,
        compareAtPrice: template.price + priceVariation + 100,
        costPrice: Math.round((template.price + priceVariation) * 0.55),
        stockQuantity: stock,
        tags: [tag],
        collections: ['Cafe Menu'],
        supplier: 'TRIO Cafe Kitchen',
        origin: 'origin' in template ? template.origin : undefined,
        roastLevel: 'roastLevel' in template ? template.roastLevel : undefined,
        caffeineContent: 'caffeineContent' in template ? template.caffeineContent : undefined,
        size: 'size' in template ? template.size : undefined,
        temperature: 'temperature' in template ? template.temperature : undefined,
        allergens: 'allergens' in template ? template.allergens : undefined,
        calories: 'calories' in template ? template.calories : undefined,
      });

      skuCounter++;
    }
  });

  return seeds;
};

const cafeSeeds = generateCafeSeeds();
const seedSkus = cafeSeeds.map((seed) => seed.sku);

const createInventoryItem = async ({
  productId,
  name,
  seed,
}: {
  productId: string;
  name: string;
  seed: CafeSeed;
}) => {
  await prisma.inventoryItem.create({
    data: {
      productId,
      productName: name,
      sku: seed.sku,
      section: Section.CAFE,
      variant: null,
      onHand: seed.stockQuantity,
      committed: 0,
      available: seed.stockQuantity,
      incoming: 0,
      location: 'Main Kitchen',
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

  const imageUrls = await uploadImagesForSku(seed.sku);

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
        create: {
          name: seed.name,
          description: seed.description,
          category: seed.category,
          origin: seed.origin,
          roastLevel: seed.roastLevel,
          caffeineContent: seed.caffeineContent,
          size: seed.size,
          temperature: seed.temperature,
          allergens: seed.allergens || [],
          calories: seed.calories,
        },
      },
      images: {
        create: [
          {
            ...imageUrls,
            altText: seed.name,
            position: 0,
          },
        ],
      },
    },
  });

  await createInventoryItem({ productId: product.id, name: seed.name, seed });
  return true;
};

const deleteExistingSeedProducts = async (): Promise<void> => {
  if (seedSkus.length === 0) {
    return;
  }

  const result = await prisma.product.deleteMany({
    where: { sku: { in: seedSkus } },
  });

  if (result.count > 0) {
    console.log(`🗑️  Deleted ${result.count} previously seeded cafe menu products`);
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

  console.log('🚀 Starting cafe menu seeding (184 products across 8 categories)');

  let created = 0;
  for (const seed of cafeSeeds) {
    const wasCreated = await createCafeProduct(seed, admin.id);
    if (wasCreated) {
      created += 1;
      if (created % 10 === 0) {
        console.log(`✓ Created ${created}/${cafeSeeds.length} products...`);
      }
    }
  }

  console.log(`🎉 Finished seeding ${created} cafe menu products.`);
  console.log(`📊 Breakdown by tag:`);
  console.log(`   - Thin Crust Pizza: 23 products`);
  console.log(`   - Turn up the heat: 23 products`);
  console.log(`   - Starters: 23 products`);
  console.log(`   - Sliders: 23 products`);
  console.log(`   - Somewhat Sooper: 23 products`);
  console.log(`   - Sandwiches: 23 products`);
  console.log(`   - Pizza Deals: 23 products`);
  console.log(`   - Coffee: 23 products`);
};

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
