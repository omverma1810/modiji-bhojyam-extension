// JavaScript failing test — run with: npx jest sum.test.js
// No installation needed (npx downloads jest automatically)

test("addition should equal 3 (intentionally wrong)", () => {
  expect(1 + 1).toBe(3); // ← This will FAIL
});

test("strings should match (intentionally wrong)", () => {
  expect("hello").toBe("world"); // ← This will FAIL
});
