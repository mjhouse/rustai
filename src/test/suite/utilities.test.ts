import * as assert from 'assert';
import * as util from '../../utilities';

suite('Utilities Test Suite', () => {

    test('Get indent with spaces', () => {
        let expected = '    ';
        let value = `${expected}TEST TEST TEST`;
        let result = util.getIndent(value);
		assert.strictEqual(expected,result);
	});

    test('Get indent with tabs', () => {
        let expected = '\t';
        let value = `${expected}TEST TEST TEST`;
        let result = util.getIndent(value);
		assert.strictEqual(expected,result);
	});

    test('Verify isTraitImpl is true for blanket impl', () => {
        let line = 'impl<A> Convert<A> for A {';
		assert(util.isTraitImpl(line));
	});

    test('Verify isTraitImpl is true for trait impl', () => {
        let line = 'impl FromBytes for u16 {';
		assert(util.isTraitImpl(line));
	});

    test('Verify isTraitImpl is false for struct impl', () => {
        let line = 'impl Binary {';
		assert(!util.isTraitImpl(line));
	});

    test('Verify isStructImpl is false for trait impl', () => {
        let line = 'impl FromBytes for u16 {';
		assert(!util.isStructImpl(line));
	});

    test('Verify isStructImpl is true for struct impl', () => {
        let line = 'impl Binary {';
		assert(util.isStructImpl(line));
	});

    test('Verify isStruct is false for struct impl', () => {
        let line = 'impl Binary {';
		assert(!util.isStruct(line));
	});

    test('Verify isStruct is true for struct', () => {
        let line = 'pub struct Binary {';
		assert(util.isStruct(line));
	});

    test('Verify isTrait is false for trait impl', () => {
        let line = 'impl FromBytes for u16 {';
		assert(!util.isTrait(line));
	});

    test('Verify isTrait is true for trait', () => {
        let line = 'pub trait IntoBytes {';
		assert(util.isTrait(line));
	});

    test('Verify isFunction is false for trait', () => {
        let line = 'pub trait IntoBytes {';
		assert(!util.isFunction(line));
	});

    test('Verify isFunction is true for function', () => {
        let line = '    fn from_bytes(b: &[u8], _: Layout) -> Result<Self> {';
		assert(util.isFunction(line));
	});

    test('Verify getTrait returns the trait name', () => {
        let line = 'pub trait FromBytes {';
		assert.strictEqual(util.getTrait(line),'FromBytes');
	});

    test('Verify getStruct returns the struct name', () => {
        let line = 'pub struct Binary {';
		assert.strictEqual(util.getStruct(line),'Binary');
	});

    test('Verify getFunction returns the function name', () => {
        let line = '    fn from_bytes(b: &[u8], _: Layout) -> Result<Self> {';
		assert.strictEqual(util.getFunction(line),'from_bytes');
	});

    test('Verify getTraitImpl returns the trait name', () => {
        let line = 'impl<A> Convert<A> for A {';
		assert.strictEqual(util.getTraitImpl(line),'Convert');
	});

    test('Verify getTraitImpl DOES NOT return the struct name', () => {
        let line = 'impl Binary {';
		assert.strictEqual(util.getTraitImpl(line),null);
	});

    test('Verify getStructImpl returns the struct name', () => {
        let line = 'impl Binary {';
		assert.strictEqual(util.getStructImpl(line),'Binary');
	});

    test('Verify getStructImpl DOES NOT return the trait name', () => {
        let line = 'impl<A> Convert<A> for A {';
		assert.strictEqual(util.getStructImpl(line),null);
	});
    
});
