/**
 * Extract all C-Style comments from the input code
 */
var CommentExtractor = (function () {
  var docCommentRegEx = /\/\*\*((?:[^*]|[\r\n]|(?:\*+(?:[^*/]|[\r\n])))*)\*\//gm;

  var cleanComment = function (comment) {
    // Split all comments at \r or \n
    var commentLines = comment.replace(/^\s+|\s+$/g,'').match(/[^\r\n]+/g);
    return commentLines.map(function(line){
      return line.replace(/^\s*\*\s*/, '');
    });
  };

  function CommentExtractor (parseContext) {
    this.parseContext = parseContext;
  }

  /**
   * Extract all comments from `code`
   * The `this.contextParser` to extract the context of the comment
   * @return {Array} Array of comment object like `{ lines : [array of comment lines], context : [result of contextParser] }`
   */
  CommentExtractor.prototype.extract = function (code) {
    var match;
    var comments = [];

    while ( (match = docCommentRegEx.exec(code)) ) {
      comments.push({
        lines: cleanComment(match[1]),
        context: this.parseContext(code.substr(match.index + match[0].length))
      });
    }

    return comments;
  };

  return CommentExtractor;
})();


/**
 * Capable of parsing comments and resolving @annotations
 */
var CommentParser = (function(){
  var annotationRegex = /^\s*@(\w+)/;

  function CommentParser (annotations) {
    this.annotations = annotations;
  }


  var parseComment = function (comment, annotations) {
    var parsedComment = {
      description: '',
      context: comment.context
    };

    comment.lines.forEach(function (line) {
      var match = annotationRegex.exec(line);
      if (match) {
        var name = annotations._.alias[match[1]] || match[1]; // Resolve name from alias
        var annotationParser = annotations[name]; // Get the annotations parser from the annotations map.

        if (annotationParser) { 
          if (typeof parsedComment[name] === 'undefined') {
            parsedComment[name] = [];
          }
            // Parsed the annotation.
            var content = line.substr(match.index + match[0].length);
            var result = annotationParser(content.replace(/^[ \t]+|[ \t]+$/g,''));

            // If it is a boolean use the annotaion as a flag
            if ( result === false || result === true) {
              parsedComment[name] = result;
            } else {
              parsedComment[name].push( result );
            }
        } else { 
          // Complain
          console.log ('Parser for annotation `' + match[1] + '` not found.');
        }
      }

      else {
        parsedComment.description += line + '\n';
      }
    });

    return parsedComment;
  };

  /**
   * Parse the comments returned by the CommentExtractor.
   * Generate data use in the view
   */
  CommentParser.prototype.parse = function (comments) {
    var result = {};

    comments.forEach(function (comment) {
      var type = comment.context.type;

      if (typeof result[type] === 'undefined') {
        result[type] = [];
      }

      result[type].push(parseComment(comment, this.annotations));
    }, this);

    return result;
  };

  return CommentParser;
})();


module.exports.CommentParser = CommentParser;
module.exports.CommentExtractor = CommentExtractor;
