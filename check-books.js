const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBooks() {
  console.log('\n=== All Books Products ===\n');

  const books = await prisma.product.findMany({
    where: {
      section: 'BOOKS',
    },
    include: {
      booksProduct: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`Total books: ${books.length}\n`);

  books.forEach((book, i) => {
    console.log(`Book ${i + 1}:`);
    console.log(`  SKU: ${book.sku}`);
    console.log(`  Title: ${book.booksProduct?.title}`);
    console.log(`  Genre: ${JSON.stringify(book.booksProduct?.genre)}`);
    console.log(`  DeletedAt: ${book.deletedAt}`);
    console.log(`  Status: ${book.status}`);
    console.log(`  Has "Fiction": ${book.booksProduct?.genre?.includes('Fiction')}`);
    console.log('');
  });

  console.log('\n=== Books with "Fiction" genre (deletedAt = null) ===\n');

  const fictionBooks = await prisma.product.findMany({
    where: {
      deletedAt: null,
      section: 'BOOKS',
      booksProduct: {
        genre: { has: 'Fiction' },
      },
    },
    include: {
      booksProduct: true,
    },
  });

  console.log(`Found ${fictionBooks.length} books with Fiction genre\n`);
  fictionBooks.forEach((book) => {
    console.log(`  - ${book.sku}: ${book.booksProduct?.title}`);
    console.log(`    Genre: ${JSON.stringify(book.booksProduct?.genre)}`);
  });

  await prisma.$disconnect();
}

checkBooks().catch(console.error);
