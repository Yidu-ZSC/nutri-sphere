import assert from 'node:assert/strict';
import test from 'node:test';
import { labelShouldShow, labelTextHeight, nodeScale, shapeKindForType } from './nodeStyle.ts';

test('node shape follows type', () => {
  assert.equal(shapeKindForType('diet_pattern'), 'rounded');
  assert.equal(shapeKindForType('food'), 'rounded');
  assert.equal(shapeKindForType('nutrient'), 'hex');
  assert.equal(shapeKindForType('compound'), 'hex');
  assert.equal(shapeKindForType('metabolite'), 'hex');
  assert.equal(shapeKindForType('mechanism'), 'diamond');
  assert.equal(shapeKindForType('disease'), 'octagon');
});

test('degree and selection change node scale', () => {
  assert.ok(nodeScale(6, 'mechanism', false) > nodeScale(1, 'food', false));
  assert.ok(nodeScale(2, 'food', true) > nodeScale(2, 'food', false));
});

test('label height stays in the readable band unless selected', () => {
  const idle = labelTextHeight(false, true);
  const dim = labelTextHeight(false, false);
  const selected = labelTextHeight(true, true);
  assert.ok(idle >= 3.2 && idle <= 4);
  assert.ok(dim >= 3.2 && dim <= 4);
  assert.ok(selected > 4);
});

test('compact screens hide labels outside the home column', () => {
  assert.equal(
    labelShouldShow({ compact: true, bright: true, selected: false, column: 0, homeColumn: 2 }),
    false,
  );
  assert.equal(
    labelShouldShow({ compact: true, bright: true, selected: false, column: 2, homeColumn: 2 }),
    true,
  );
  assert.equal(
    labelShouldShow({ compact: true, bright: false, selected: true, column: 0, homeColumn: 2 }),
    true,
  );
  assert.equal(
    labelShouldShow({ compact: false, bright: false, selected: false, column: 0, homeColumn: 2 }),
    true,
  );
  assert.equal(
    labelShouldShow({
      compact: true,
      bright: true,
      selected: false,
      column: 2,
      homeColumn: 2,
      nodeY: 80,
      focusY: 0,
      yWindow: 40,
    }),
    false,
  );
});
