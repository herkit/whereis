var assert = require('assert');
var db = require('../../src/server/db');

describe('Db.js', function() {
  describe('db.restructure', function() {
    it('should restructure a simple structure', function() {
      var result = db.restructure({
        'test_property1': 1234,
        'test_property2': 3456,
        'property1': 4567,
        'test2_property1': "some text"
      })
      assert.equal(
        JSON.stringify(result),
        JSON.stringify(
          { 
            "test": { 
              "property1": 1234, 
              "property2": 3456,
            },
            "property1": 4567,
            "test2": {
              "property1": "some text"
            }
          }
        )
      );
    })
    it('should not restructure a when a mix between object and scalar values', function() {
      var result = db.restructure({
        'p1': 3456,
        'p1_p1': 1234,
        'p2': 4567,
        'p3_p1': "some text",
        'p4_p1': 3456,
        'p4_p1_p1_p1': 321,
        'p4_p1_p1_p2': 323
      })
      assert.equal(
        JSON.stringify(result),
        JSON.stringify(
          { 
            "p1": 3456,
            "p1_p1": 1234,
            "p2": 4567,
            "p3": {
              "p1": "some text"
            },
            "p4_p1": 3456,
            "p4_p1_p1": {
              "p1": 321,
              "p2": 323
            }
          }
        )
      );
    })    
  })
})