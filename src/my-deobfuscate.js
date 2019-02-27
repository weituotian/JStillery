var genCode = require("escodegen").generate;

var reduceContext = {};

function ast_reduce(ast, parent) {

    let ret;
    parent = parent || {};

    console.log(genCode);

    var ast_reduce_scoped = function (child) {
        return ast_reduce(child, ast);
    };

    function arr_ast_reduce(targets) {
        const rets = [];
        targets.forEach(target => {
            const result = ast_reduce_scoped(target);
            if (result instanceof Array) {
                result.forEach(item => {
                    rets.push(item);
                });
            } else {
                rets.push(result);
            }
        });
        return rets;
    }

    switch (ast.type) {

        case 'Program':
            ret = {
                type: 'Program',
                body: arr_ast_reduce(ast.body)
            };
            return ret;

        case 'FunctionDeclaration':
            ret = {
                type: ast.type,
                id: ast.id,
                params: ast.params,
                body: ast_reduce_scoped(ast.body),
                test: ast.test,
                alreadyReduced: true,
                generator: ast.generator,
                expression: ast.expression
            };
            return ret;

        case 'AssignmentExpression':

            if (ast.right.type === 'ConditionalExpression') {
                ret = ast_reduce_scoped(ast.right)

            } else {
                ret = {
                    type: ast.type,
                    operator: ast.operator,
                    left: ast_reduce_scoped(ast.left),
                    right: ast_reduce_scoped(ast.right)
                };
            }
            return ret;

        case 'BlockStatement':
            ret = {
                type: ast.type,
                body: arr_ast_reduce(ast.body)
            };

            return ret;

        case 'ReturnStatement':
            if (ast.argument == null) {
                return ast;
            }

            const value = ast_reduce_scoped(ast.argument);

            if (ast.argument.type === 'SequenceExpression') {
                return value;
            } else {
                ret = {
                    type: 'ReturnStatement',
                    argument: value
                };
                return ret;
            }

        case 'VariableDeclaration': {
            const rets = [];
            ast.declarations.forEach(declaration => { // 这里对分开每一个变量声明,var a,b => var a; var b;
                let declaras = ast_reduce_scoped(declaration); // 子表达式结果

                function handleDeclara(declara) {
                    if (declara.type === 'VariableDeclarator') {
                        ret = {
                            type: 'VariableDeclaration',
                            kind: ast.kind,
                            declarations: [declara]
                        };
                        rets.push(ret);
                    } else {
                        rets.push(declara);
                    }
                }

                if (declaras instanceof Array) {
                    declaras.forEach(handleDeclara);
                } else {
                    handleDeclara(declaras);
                }

            });
            return rets;
        }
        case 'VariableDeclarator': {

            if (ast.init.type === 'ConditionalExpression') {
                let rets = [];
                rets.push({
                    type: ast.type,
                    id: ast_reduce_scoped(ast.id),
                    init: {
                        "type": "Literal",
                        "value": null,
                        "raw": "null"
                    }
                }); // 变量声明
                rets.push(ast_reduce_scoped(ast.init));// 一个if语句
                return rets;
            } else {
                ret = {
                    type: ast.type,
                    id: ast_reduce_scoped(ast.id),
                    init: ast_reduce_scoped(ast.init)
                };
                return ret;
            }
        }
        case 'ExpressionStatement':
            if (ast.expression.type === 'ConditionalExpression') {
                ast.expression.canbetransformed = true;
            }
            ret = {
                type: ast.type,
                expression: ast_reduce_scoped(ast.expression)
            };

            /// Transforms SequenceExpression a,b,c to BlockStatement a;b;c; but only if it is standalone (Ie not in another expression)
            /*
            c=3;
            test,v=4,h=4;
            -->
            c = 3;
            test;
            v = 4;
            h = 4;
            */
            if (ret.expression.type === 'SequenceExpression'
                && (parent.type === 'BlockStatement' || parent.type === 'Program')
            ) {
                let _tmp = ret.expression.expressions.map(el => {
                    return {type: 'ExpressionStatement', expression: el}
                });
                ret = {
                    type: 'Program', // This is a hack because we need to return a ast node, and we actually have n nodes in a block.
                    // so instead of using BlockStatement, which would be rewritten as {.expressions..}, we use Program
                    // expressions are not surrounded by brackets.
                    body: _tmp
                };
                parent.body[parent.body.indexOf(ast.expression)] = ret;
                //parent.body.splice.apply(parent.body,[parent.body.indexOf(ast.expression),1].concat(_tmp));
                return ret;
            }

            return ret;

        case 'SequenceExpression': {

            const rets = [];

            if (parent.type === 'ReturnStatement') { //

                ast.expressions.forEach(function (expression, index) {
                    if (index === ast.expressions.length - 1) {
                        rets.push({
                            type: 'ReturnStatement',
                            argument: ast_reduce_scoped(expression),
                        });
                        return;
                    }
                    rets.push({
                        type: "ExpressionStatement",
                        expression: ast_reduce_scoped(expression)
                    });
                });

                return rets;

            } else {
                ret = {
                    type: 'BlockStatement',
                    body: []
                };
                rets.push(ret);
                ast.expressions.forEach(function (expression, index) {
                    ret.body.push({
                        type: "ExpressionStatement",
                        expression: ast_reduce_scoped(expression)
                    });
                });

                return ret;
            }

        }

        case 'ConditionalExpression': // a?b:c

            let getExpression = function getExpression(parentVar, target) {
                let block = {
                    type: 'BlockStatement',
                    body: []
                };

                let assignExp = {
                    "type": "AssignmentExpression",
                    "operator": "=",
                    "left": parentVar,
                    // "right": consequent
                };
                let childResult = ast_reduce(target, assignExp);
                if (target.type === 'ConditionalExpression') {
                    assignExp = childResult; // 这里 childResult 将是一个if语句
                } else {
                    assignExp.right = childResult;
                }

                return assignExp;

                // block.body.push(assignExp);
                // return block;// 返回这个会有花括号
            };

            if (parent.type === 'AssignmentExpression' || parent.type === 'VariableDeclarator') {
                // 例子: x= a?b:c
                // parentVar 代表x
                //  a?b:c 是当前
                // 目的是将x传进 a?b:c， 需要替换  x= a?b:c 这个赋值语句为 if 语句
                let parentVar;
                if (parent.type === 'AssignmentExpression') {
                    parentVar = ast_reduce(parent.left, parent);
                } else if (parent.type === 'VariableDeclarator') {
                    parentVar = ast_reduce(parent.id, parent);
                }

                let block1 = getExpression(parentVar, ast.consequent);
                let block2 = getExpression(parentVar, ast.alternate);

                ret = {
                    type: 'IfStatement',
                    test: ast_reduce_scoped(ast.test), //Expand or Not? Lookahead?
                    consequent: block1,
                    alternate: block2
                };

            }
            else {
                let consequent = ast_reduce_scoped(ast.consequent);
                let alternate = ast_reduce_scoped(ast.alternate);
                ret = {
                    type: 'IfStatement',                 // 转化为if 语句
                    test: ast_reduce_scoped(ast.test), //Expand or Not? Lookahead?
                    consequent: consequent,
                    alternate: alternate
                };
            }

            return ret;

        default:
            return ast;
    }

}

module.exports = {
    deobfuscate: function (ast, parent) {
        reduceContext = {};
        return ast_reduce(ast, parent);
    },
};
