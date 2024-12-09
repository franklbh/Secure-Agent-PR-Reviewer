import { SyntaxNode } from "tree-sitter";
import { AbstractParser, EnclosingContext } from "../../constants";

const Parser = require("tree-sitter");
const Python = require("tree-sitter-python");

const parser = new Parser();
parser.setLanguage(Python);

const evaluateNode = (
  node: SyntaxNode,
  rangeStart: number,
  rangeEnd: number,
  currentMaxSize: number,
  bestMatchNode: SyntaxNode | null
): { newMaxSize: number; bestNode: SyntaxNode | null } => {
  const nodeStart = node.startPosition.row;
  const nodeEnd = node.endPosition.row;

  if (nodeStart <= rangeStart && rangeEnd <= nodeEnd) 
  {
    const nodeSize = nodeEnd - nodeStart;
    if (nodeSize > currentMaxSize) 
    {
      currentMaxSize = nodeSize;
      bestMatchNode = node;
    }
  }
  return { newMaxSize: currentMaxSize, bestNode: bestMatchNode };
};

export class PythonParser implements AbstractParser 
{
  findEnclosingContext 
  (
    fileContent: string,
    lineStart: number,
    lineEnd: number
  ): EnclosingContext 
  {
    const syntaxTree = parser.parse(fileContent);
    let bestNode: SyntaxNode = null;
    let maxSize = 0;

    const cursor = syntaxTree.walk();
    const traverseTree = (cursor: any): void => 
    {
      const node = cursor.currentNode;

      // Check only function or class nodes
      if (["function_definition", "class_definition"].includes(node.type)) 
      {
        const { newMaxSize, bestNode: updatedNode } = evaluateNode (
          node,
          lineStart,
          lineEnd,
          maxSize,
          bestNode
        );
        maxSize = newMaxSize;
        bestNode = updatedNode;
      }

      // Recursively traverse child nodes
      if (cursor.gotoFirstChild()) 
      {
        traverseTree(cursor);
        cursor.gotoParent(); // Return to parent node
      }
    };

    traverseTree(cursor);

    return {
      enclosingContext: bestNode,
    } as EnclosingContext;
  }

  dryRun(fileContent: string): { valid: boolean; error: string } 
  {
    try 
    {
      parser.parse(fileContent); // Simply try parsing the file
      return { valid: true, error: "" };
    } 
    catch (error) 
    {
      return { valid: false, error: error.message || "Unknown error" };
    }
  }
}
