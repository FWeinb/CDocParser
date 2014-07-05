var assert = require("assert");
var docParser = require('../');


describe('CommentExtractor', function(){

  var extractor = new docParser.CommentExtractor( function (){ return { type : 'testCtx'}; } );

  describe('#extract', function(){
    it('should extract 1 comments', function(){
      var comments = extractor.extract('/**\n* Comment\n */');
      assert.equal(comments.length, 1);
      assert.equal(comments[0].lines.length, 1);
      assert.equal(comments[0].lines[0], 'Comment\n ');
    });

    it('should extract more than one comment', function(){
      var comments = extractor.extract('/**\n* Comment\n */ /**\n* Comment\n */ /**\n* Comment\n */');
      assert.equal(comments.length, 3);
    });

    it('should ignore block comments like /* comment */', function(){
      var comments = extractor.extract('/**\n* Comment\n */ /*\n* Comment\n */ /**\n* Comment\n */');
      assert.equal(comments.length, 2);
    });

    it('should include a context', function(){
      var comments = extractor.extract('/**\n* Comment\n */');
      assert.equal(comments.length, 1);
      assert.equal(comments[0].context.type, 'testCtx');
    });
  });

});


describe('CommentParser', function(){

  // Test comments
  var comments = [
    { lines : ['test', 'test', '@test'], context : { type : 'testType1'} },
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
    test : function ( commentLine ){
      return "Working";
    },

    flag : function(){
      return true;
    },

    multiline : function(commentLine){
      return commentLine;
    }
  };

  var parser = new docParser.CommentParser( annotations );

  describe('#parse', function(){
    it('should group comments by context type', function(){
     var result = parser.parse ( comments );
         assert.equal(result.testType1.length , 1);
         assert.equal(result.testType2.length , 2);
	 assert.equal(result.testType3.length , 3);
    });

    it('should join lines without annotation into description', function(){
     var result = parser.parse ( comments );
         assert.equal(result.testType1.length , 1);
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

  });

});
