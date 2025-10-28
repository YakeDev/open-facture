process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/open_facture_test'
process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-change-me-please-1234567890'
