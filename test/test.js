var assert = require("assert");
var docParser = require('../');


describe('CommentExtractor', function(){

  var extractor = new docParser.CommentExtractor( function (){ return { type : 'testCtx'}; } );

  describe('#extract', function(){
    it('should extract 1 comments', function(){
      var comments = extractor.extract('/**\n* Comment\n */');
      assert.equal(comments.length, 1);
      assert.equal(comments[0].lines.length, 1);
      assert.equal(comments[0].lines[0], 'Comment');
    });

    it('should remove "*" in empty lines', function(){
      var comments = extractor.extract('/**\n * Test\n * \n * Test\n */');
      assert.deepEqual(comments[0].lines, [ "Test","","Test" ]);
    });

    it('shuld not split every "*"', function(){
      var comments = extractor.extract('/**\n * @param {*} $list - list to purge\n * Test\n * \n * Test\n */');
      assert.deepEqual(comments[0].lines, [ "@param {*} $list - list to purge","Test","","Test" ]);
    });

    it('should extract more than one comment', function(){
      var comments = extractor.extract('/**\n * Comment\n */\n/**\n * Comment\n */\n/**\n* Comment\n */');
      assert.equal(comments.length, 3);
    });

    it ('should ignore block comments like /* comment */', function(){
      var comments = extractor.extract('/**\n* Comment\n */\n/*\n* Comment\n */\n/**\n* Comment\n */');
      assert.equal(comments.length, 2);
    });

    it('should include a context', function(){
      var comments = extractor.extract('/**\n* Comment\n */');
      assert.equal(comments.length, 1);
      assert.equal(comments[0].context.type, 'testCtx');
    });

    it('should ignore `**` in single line comments', function(){
      var comments = extractor.extract('//** \n\n\n */');
      assert.equal(comments.length, 0);
    });

    it('should normalize the indentation', function(){
      var comments = extractor.extract('/**\n * @example\n *  @include chain(bright, ".test") {\n *    color: #fff;\n *  }\n */');
      assert.deepEqual(comments[0].lines, ['@example', ' @include chain(bright, ".test") {', '   color: #fff;', ' }' ]);
    });


  });

});


describe('CommentParser', function(){

  // Test comments
  var comments = [
    { lines : ['test', 'test', '@test'], context : { type : 'testType1'} },
    { lines : ['test', 'test', ' @test'], context : { type : 'testType1'} },
    { lines : ['test', '@ignore ingore this', 'test', '@ignore ingore this'], context : { type : 'testType1'} },
    { lines : ['test', 'test', '@aliasTest'], context : { type : 'testType2'} },
    { lines : ['test', 'test', '@test'], context : { type : 'testType2'} },
    { lines : ['test', 'test', '@test'], context : { type : 'testType3'} },
    { lines : ['test', 'test', '@flag'], context : { type : 'testType3'} },
    { lines : ['@multiline\nThis is a\nmultiline\nannotation\n'], context : { type : 'testType3'} }
  ];

  // Test Annotations
  var annotations = {
    _ : {
      alias : {
        "aliasTest" : "test"
      }
    },
    ignore : {
      parse : function() {}
    },
    test : {
      parse : function ( commentLine ){
        return "Working";
      },
      default : function(){
        return "Default";
      }
    },
    flag : {
      parse : function(){
        return true;
      }
    },
    multiline : {
      parse : function(commentLine){
        return commentLine;
      }
    }
  };

  var parser = new docParser.CommentParser( annotations );

  describe('#parse', function(){
    it('should group comments by context type', function(){
     var result = parser.parse ( comments );
         assert.equal(result.testType1.length , 3);
         assert.equal(result.testType2.length , 2);
        assert.equal(result.testType3.length , 3);
    });

    it('should add default values', function(){
     var result = parser.parse ( comments );
          assert.equal(result.testType3[1].test[0] , 'Default' );
    });

    it('should join lines without annotation into description', function(){
     var result = parser.parse ( comments );
         assert.equal(result.testType1[0].description , 'test\ntest\n');
    });

    it('should resolve a alias to the real name', function(){
     var result = parser.parse ( comments );
         assert.equal(result.testType2.length , 2);
         assert.equal(result.testType2[0].test[0] , 'Working' );
    });

    it('should convert an annotation that returns a boolean to a flag', function(){
     var result = parser.parse ( comments );
          assert.equal(result.testType3[1].flag , true );
    });

    it('should parse a multiline annotation', function(){
     var result = parser.parse ( comments );
          assert.equal(result.testType3[2].multiline[0] , "\nThis is a\nmultiline\nannotation\n");

    });

    it('should ignore annotations that aren\'t at the start of the line', function(){
     var result = parser.parse ( comments );
          assert.equal(result.testType1[1].test[0] , 'Default');
    });

    it('should ignore annotations that won\'t return anything', function(){
     var result = parser.parse ( comments );
          assert.deepEqual(result.testType1[2].ignore , []);
    });

  });

});
