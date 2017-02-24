var assert = require('assert');
var Parser = require('../../src/lib/gpsreceiver/parser').Parser,
    CoordinateFormat = require('../../src/lib/gpsreceiver/parser').CoordinateFormat;

describe('Parser', function() {
  it('should parse ints', function() {
    var parser = new Parser('(\\d{2})(\\d{2})', "0102");
    assert.equal(parser.nextInt(), 1);
    assert.equal(parser.nextInt(), 2);
  })
  it('should parse floats', function() {
    var parser = new Parser('(\\d+\\.\\d+).+(\\d+\\.\\d+)', 'Some text 123.23, 3.145917');
    assert.equal(parser.nextFloat(), 123.23);
    assert.equal(parser.nextFloat(), 3.145917);
  })
  it('should parse coordinates', function() {
    var parser = new Parser('(\\d*?)(\\d?\\d.\\d+),([NS])', 'Some text 0503.12345,N');
    assert.equal(parser.nextCoordinate(), 5.0520575);
  })
  it('should parse DEG_DEG', function() {
    var parser = new Parser('(-?\\d{2})(\\d{2})', '-1010');
    assert.equal(parser.nextCoordinate(CoordinateFormat.DEG_DEG), -10.10);
  })
  it('should parse DEG_HEM', function() {
    var parser = new Parser('(\\d+\\.\\d+)([NS])(\\d+\\.\\d+)([EW])', '5.0520S12.123E');
    assert.equal(parser.nextCoordinate(CoordinateFormat.DEG_HEM), -5.052);
    assert.equal(parser.nextCoordinate(CoordinateFormat.DEG_HEM), 12.123);
  })
  it('should parse DEG_MIN_MIN', function() {
    var parser = new Parser('(\\d?\\d{2})(\\d{2})(\\d{5})', '0050312345');
    assert.equal(parser.nextCoordinate(CoordinateFormat.DEG_MIN_MIN), 5.0520575);
  })
  it('should parse DEG_MIN_MIN_HEM', function() {
    var parser = new Parser('(\\d?\\d{2})(\\d{2})(\\d{5})([NS])', '0050312345S');
    assert.equal(parser.nextCoordinate(CoordinateFormat.DEG_MIN_MIN_HEM), -5.0520575);
  })
  it('should parse HEM_DEG', function() {
    var parser = new Parser('([NS])(\\d+\\.\\d+)([EW])(\\d+\\.\\d+)', 'N5.0520W12.123');
    assert.equal(parser.nextCoordinate(CoordinateFormat.HEM_DEG), 5.052);
    assert.equal(parser.nextCoordinate(CoordinateFormat.HEM_DEG), -12.123);
  })
  it('should parse HEM_DEG_MIN', function() {
    var parser = new Parser('([NS])(\\d+)(\\d{2}\\.\\d+)([EW])(\\d+)(\\d{2}.\\d+)', 'N0503.12345W0503.12345');
    assert.equal(parser.nextCoordinate(CoordinateFormat.HEM_DEG_MIN), 5.0520575);
    assert.equal(parser.nextCoordinate(CoordinateFormat.HEM_DEG_MIN), -5.0520575);
  })
  it('should parse HEM_DEG_MIN_HEM', function() {
    var parser = new Parser('([NS])(\\d+)(\\d{2}\\.\\d+)([EW])([NS])(\\d+)(\\d{2}\\.\\d+)', 'N0503.12345WN0503.12345');
    assert.equal(parser.nextCoordinate(CoordinateFormat.HEM_DEG_MIN_HEM), -5.0520575);
    assert.equal(parser.nextCoordinate(CoordinateFormat.HEM_DEG_MIN_HEM), 5.0520575);
  })
  it('should parse HEM_DEG_MIN_MIN', function() {
    var parser = new Parser('([NS])(\\d?\\d{2})(\\d{2})(\\d{5})', 'S00503123455');
    assert.equal(parser.nextCoordinate(CoordinateFormat.HEM_DEG_MIN_MIN), -5.0520575);
  })    
  it('should parse DEG_MIN_HEM', function() {
    var parser = new Parser('(\\d*?)(\\d?\\d.\\d+),([NS])', 'Some text 0503.12345,N');
    assert.equal(parser.nextCoordinate(CoordinateFormat.DEG_MIN_HEM), 5.0520575);
  })
})