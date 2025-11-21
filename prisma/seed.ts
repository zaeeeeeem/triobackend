import { PrismaClient, UserRole, Section, ProductStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data (optional - comment out if you want to keep existing data)
  await prisma.orderItem.deleteMany();
  await prisma.shippingAddress.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.inventoryAdjustment.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Cleaned existing data');

  // Create Users
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const managerPassword = await bcrypt.hash('Manager@123', 10);
  const staffPassword = await bcrypt.hash('Staff@123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@trio.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@trio.com',
      password: managerPassword,
      firstName: 'Cafe',
      lastName: 'Manager',
      role: UserRole.MANAGER,
      assignedSection: Section.CAFE,
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: 'staff@trio.com',
      password: staffPassword,
      firstName: 'Staff',
      lastName: 'User',
      role: UserRole.STAFF,
    },
  });

  console.log('✓ Created users');

  // Create Sample Products - CAFE
  const cafeProducts = [
    {
      name: 'Cappuccino',
      description: 'Classic Italian espresso with steamed milk and foam',
      section: Section.CAFE,
      price: 350,
      sku: 'CAF-CAP-001',
      stockQuantity: 100,
      status: ProductStatus.ACTIVE,
      cafeAttributes: {
        category: 'coffee',
        caffeineContent: 'high',
        sizes: ['Small', 'Medium', 'Large'],
        temperatureOptions: ['hot', 'iced'],
        ingredients: ['Espresso', 'Milk', 'Foam'],
        allergens: ['Dairy'],
        calories: 120,
        preparationTime: '5 mins',
      },
    },
    {
      name: 'Latte',
      description: 'Smooth espresso with steamed milk',
      section: Section.CAFE,
      price: 380,
      sku: 'CAF-LAT-001',
      stockQuantity: 85,
      status: ProductStatus.ACTIVE,
      cafeAttributes: {
        category: 'coffee',
        caffeineContent: 'high',
        sizes: ['Small', 'Medium', 'Large'],
        temperatureOptions: ['hot', 'iced'],
        ingredients: ['Espresso', 'Milk'],
        allergens: ['Dairy'],
        calories: 150,
        preparationTime: '5 mins',
      },
    },
    {
      name: 'Croissant',
      description: 'Buttery, flaky French pastry',
      section: Section.CAFE,
      price: 180,
      sku: 'CAF-CRO-001',
      stockQuantity: 50,
      status: ProductStatus.ACTIVE,
      cafeAttributes: {
        category: 'pastry',
        caffeineContent: 'none',
        sizes: ['Regular'],
        temperatureOptions: ['room'],
        ingredients: ['Flour', 'Butter', 'Yeast'],
        allergens: ['Gluten', 'Dairy'],
        calories: 230,
        preparationTime: '2 mins',
      },
    },
  ];

  // Create Sample Products - FLOWERS
  const flowersProducts = [
    {
      name: 'Rose Elegance Bouquet',
      description: 'Stunning arrangement of premium red roses',
      section: Section.FLOWERS,
      price: 2500,
      sku: 'FLO-ROS-001',
      stockQuantity: 25,
      status: ProductStatus.ACTIVE,
      flowersAttributes: {
        flowerTypes: ['Roses'],
        colors: ['Red'],
        arrangementType: 'bouquet',
        stemCount: 12,
        vaseIncluded: false,
        occasions: ['Anniversary', 'Birthday', 'Apology'],
        careInstructions: 'Keep in cool water, change water daily',
        deliveryOptions: ['standard', 'express', 'same_day'],
      },
    },
    {
      name: 'Spring Mix Vase',
      description: 'Delightful mix of seasonal spring flowers',
      section: Section.FLOWERS,
      price: 3800,
      sku: 'FLO-MIX-001',
      stockQuantity: 15,
      status: ProductStatus.ACTIVE,
      flowersAttributes: {
        flowerTypes: ['Tulips', 'Daffodils', 'Hyacinths'],
        colors: ['Yellow', 'Pink', 'White'],
        arrangementType: 'vase',
        stemCount: 20,
        vaseIncluded: true,
        occasions: ['Birthday', 'Thank You'],
        careInstructions: 'Keep away from direct sunlight',
        deliveryOptions: ['standard', 'express'],
      },
    },
  ];

  // Create Sample Products - BOOKS
  const booksProducts = [
    {
      title: 'Atomic Habits',
      description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones',
      section: Section.BOOKS,
      price: 1450,
      sku: 'BOO-SEL-001',
      stockQuantity: 40,
      status: ProductStatus.ACTIVE,
      booksAttributes: {
        author: 'James Clear',
        isbn: '978-0735211292',
        publisher: 'Avery',
        publicationDate: new Date('2018-10-16'),
        pages: 320,
        language: 'English',
        format: 'hardcover',
        condition: 'new',
        genre: ['Self-Help', 'Psychology', 'Business'],
      },
    },
    {
      title: 'The Kite Runner',
      description: 'A powerful story of friendship and redemption',
      section: Section.BOOKS,
      price: 950,
      sku: 'BOO-FIC-001',
      stockQuantity: 35,
      status: ProductStatus.ACTIVE,
      booksAttributes: {
        author: 'Khaled Hosseini',
        isbn: '978-1594631931',
        publisher: 'Riverhead Books',
        publicationDate: new Date('2003-05-29'),
        pages: 371,
        language: 'English',
        format: 'paperback',
        condition: 'new',
        genre: ['Fiction', 'Historical', 'Drama'],
      },
    },
  ];

  // Create all products
  const allProducts = [...cafeProducts, ...flowersProducts, ...booksProducts];

  for (const productData of allProducts) {
    const product = await prisma.product.create({
      data: {
        ...productData,
        availability: 'AVAILABLE',
        trackQuantity: true,
        continueSellingOutOfStock: false,
        tags: [],
        collections: [],
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    });

    // Create inventory item for each product
    await prisma.inventoryItem.create({
      data: {
        productId: product.id,
        productName: product.name || product.title || '',
        sku: product.sku,
        section: product.section,
        onHand: product.stockQuantity,
        available: product.stockQuantity,
        committed: 0,
        incoming: 0,
        location: 'Main Warehouse',
        costPrice: Number(product.price) * 0.6, // 60% of selling price
        sellingPrice: product.price,
        status: 'IN_STOCK',
        reorderPoint: 10,
        reorderQuantity: 50,
      },
    });
  }

  console.log('✓ Created sample products');

  // Create Sample Customers
  const customers = [
    {
      email: 'customer1@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+92-300-1234567',
      totalOrders: 0,
      totalSpent: 0,
    },
    {
      email: 'customer2@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+92-300-7654321',
      totalOrders: 0,
      totalSpent: 0,
    },
  ];

  for (const customerData of customers) {
    await prisma.customer.create({ data: customerData });
  }

  console.log('✓ Created sample customers');

  console.log('\n🎉 Database seeding completed successfully!\n');
  console.log('Default Users:');
  console.log('--------------------');
  console.log('Admin:');
  console.log('  Email: admin@trio.com');
  console.log('  Password: Admin@123');
  console.log('\nManager (Cafe Section):');
  console.log('  Email: manager@trio.com');
  console.log('  Password: Manager@123');
  console.log('\nStaff:');
  console.log('  Email: staff@trio.com');
  console.log('  Password: Staff@123');
  console.log('--------------------\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
