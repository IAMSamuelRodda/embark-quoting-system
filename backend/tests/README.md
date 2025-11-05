# Backend Tests

This directory contains tests for the Embark Quoting System backend.

## Test Structure

```
tests/
├── integration/          # Integration tests (database, API)
│   └── database.test.js  # Database connection tests
└── README.md
```

Unit tests are co-located with source files:
```
src/features/quotes/
├── quotes.service.js
├── quotes.service.test.js  # Unit tests for service
└── ...
```

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Integration Tests

Integration tests require a running PostgreSQL database. Make sure to:

1. Set up database connection in `.env`:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=embark_quotes
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

2. Run migrations:
   ```bash
   npm run db:migrate
   ```

3. Run integration tests:
   ```bash
   npm run test:integration
   ```

## Writing Tests

### Unit Tests

- Co-locate with source files (`*.test.js`)
- Test individual functions in isolation
- Mock external dependencies
- Fast execution (<100ms per test)

### Integration Tests

- Place in `tests/integration/`
- Test interaction between components
- Use real database connections
- May be slower (database queries)

## Best Practices

1. **Descriptive Test Names**: Use `describe` and `it` blocks with clear descriptions
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Independent Tests**: Each test should be independent
4. **Clean Up**: Use `afterEach`/`afterAll` to clean up resources
5. **Coverage Goals**: Aim for 50%+ coverage (configured in `jest.config.js`)
