import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeInventoryMetrics,
  parseProductQuery,
  validateCategoryName,
  validateProductPayload,
  validateTagName,
} from './validation.ts';

test('validateProductPayload trims strings and accepts valid product data', () => {
  const res = validateProductPayload({
    name: '  Studio Monitor  ',
    description: '  Near-field reference speaker  ',
    price: 249.995,
    quantity: 12,
    category_id: 2,
  });

  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.data.name, 'Studio Monitor');
    assert.equal(res.data.description, 'Near-field reference speaker');
    assert.equal(res.data.price, 250);
    assert.equal(res.data.quantity, 12);
    assert.equal(res.data.category_id, 2);
  }
});

test('validateProductPayload rejects invalid bounds matching original Pydantic rules', () => {
  assert.equal(
    validateProductPayload({
      name: '',
      description: 'Valid',
      price: 10,
      quantity: 1,
      category_id: 1,
    }).ok,
    false
  );

  assert.equal(
    validateProductPayload({
      name: 'a'.repeat(31),
      description: 'Valid',
      price: 10,
      quantity: 1,
      category_id: 1,
    }).ok,
    false
  );

  assert.equal(
    validateProductPayload({
      name: 'Valid',
      description: 'Valid',
      price: 0,
      quantity: 1,
      category_id: 1,
    }).ok,
    false
  );

  assert.equal(
    validateProductPayload({
      name: 'Valid',
      description: 'Valid',
      price: 10,
      quantity: -1,
      category_id: 1,
    }).ok,
    false
  );
});

test('validateCategoryName and validateTagName enforce length constraints', () => {
  const catOk = validateCategoryName({ name: '  Audio  ' });
  assert.equal(catOk.ok, true);
  if (catOk.ok) assert.equal(catOk.data, 'Audio');

  assert.equal(validateCategoryName({ name: '   ' }).ok, false);
  assert.equal(validateCategoryName({ name: 'x'.repeat(31) }).ok, false);

  const tagOk = validateTagName({ name: '  wireless-pro  ' });
  assert.equal(tagOk.ok, true);
  if (tagOk.ok) assert.equal(tagOk.data, 'wireless-pro');
  assert.equal(validateTagName({ name: 't'.repeat(51) }).ok, false);
});

test('parseProductQuery handles defaults, filters, and rejects invalid params', () => {
  const def = parseProductQuery({});
  assert.equal(def.ok, true);
  if (def.ok) {
    assert.equal(def.data.skip, 0);
    assert.equal(def.data.limit, 20);
    assert.equal(def.data.category_id, undefined);
    assert.equal(def.data.max_price, undefined);
  }

  const filtered = parseProductQuery({
    skip: '5',
    limit: '10',
    category_id: '3',
    max_price: '199.5',
    search: '  desk  ',
  });
  assert.equal(filtered.ok, true);
  if (filtered.ok) {
    assert.equal(filtered.data.skip, 5);
    assert.equal(filtered.data.limit, 10);
    assert.equal(filtered.data.category_id, 3);
    assert.equal(filtered.data.max_price, 199.5);
    assert.equal(filtered.data.search, 'desk');
  }

  assert.equal(parseProductQuery({ skip: '-1' }).ok, false);
  assert.equal(parseProductQuery({ limit: '101' }).ok, false);
  assert.equal(parseProductQuery({ max_price: '0' }).ok, false);
});

test('computeInventoryMetrics aggregates units, value, and low stock accurately', () => {
  const metrics = computeInventoryMetrics([
    {
      id: 1,
      name: 'Item A',
      description: 'Desc A',
      price: 100,
      quantity: 3,
      category_id: 1,
      category: { id: 1, name: 'Audio' },
      tags: [],
    },
    {
      id: 2,
      name: 'Item B',
      description: 'Desc B',
      price: 50.5,
      quantity: 10,
      category_id: 1,
      category: { id: 1, name: 'Audio' },
      tags: [],
    },
  ]);

  assert.equal(metrics.totalProducts, 2);
  assert.equal(metrics.totalUnits, 13);
  assert.equal(metrics.totalValue, 805);
  assert.equal(metrics.lowStockCount, 1);
});
