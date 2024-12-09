const Parser = require("tree-sitter");
const Python = require("tree-sitter-python");

const parser = new Parser();
parser.setLanguage(Python);

const code = `
def my_function():
    print("Hello, World!")
`;

const tree = parser.parse(code);
console.log(tree.rootNode.toString());
