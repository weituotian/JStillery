```json
{
  "type": "ForStatement",
  "init": {
    "type": "SequenceExpression",
    "expressions": [
      {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "Identifier",
          "name": "a"
        },
        "right": {
          "type": "Literal",
          "value": 1,
          "raw": "1"
        }
      },
      {
        "type": "AssignmentExpression",
        "operator": "=",
        "left": {
          "type": "Identifier",
          "name": "b"
        },
        "right": {
          "type": "Literal",
          "value": 2,
          "raw": "2"
        }
      }
    ]
  },
  "test": {
    "type": "BinaryExpression",
    "operator": "<",
    "left": {
      "type": "Identifier",
      "name": "a"
    },
    "right": {
      "type": "Literal",
      "value": 5,
      "raw": "5"
    }
  },
  "update": {
    "type": "UpdateExpression",
    "operator": "++",
    "argument": {
      "type": "Identifier",
      "name": "a"
    },
    "prefix": false
  },
  "body": {
    "type": "ExpressionStatement",
    "expression": {
      "type": "UpdateExpression",
      "operator": "++",
      "argument": {
        "type": "Identifier",
        "name": "b"
      },
      "prefix": false
    }
  }
}

```
